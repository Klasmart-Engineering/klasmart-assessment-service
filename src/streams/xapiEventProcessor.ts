import { XApiRecord } from '../db/xapi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { Repository } from 'typeorm'
import ContentKey from '../helpers/contentKey'
import { RedisStreams, StreamMessageReply } from './redisApi'
import { RawAnswer } from '../db/assessments/entities/rawAnswer'
import { Room } from '../db/assessments/entities'
import { RoomScoresTemplateProvider } from '../providers/roomScoresTemplateProvider'

const logger = withLogger('XapiEventProcessor')

type XapiScore = {
  min?: number
  max?: number
  raw?: number
  scaled?: number
}

type ParsedXapiEvent = {
  userId: string
  roomId: string
  h5pId: string
  timestamp: number
  h5pSubId?: string
  h5pType?: string
  h5pName?: string
  h5pParentId?: string
  verb?: string
  score?: XapiScore
  response?: string
}

type XApiRecordEvent = ParsedXapiEvent & {
  entryId: string
  authenticationToken?: string
}

const categoryRegex = new RegExp(
  `^http://h5p.org/libraries/H5P.(.+)-\\d+.\\d+$`,
)

export const parseRawEvent = (
  rawXapiEvent: XApiRecord | undefined,
  entryId: string,
): XApiRecordEvent | null => {
  const userId = rawXapiEvent?.userId
  const roomId = rawXapiEvent?.roomId
  const authenticationToken = rawXapiEvent?.authenticationToken
  const timestamp = rawXapiEvent?.xapi?.clientTimestamp
  const statement = rawXapiEvent?.xapi?.data?.statement
  const extensions = statement?.object?.definition?.extensions
  const h5pId =
    extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
  const h5pSubId =
    extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

  if (
    !roomId ||
    !statement?.object?.definition ||
    !userId ||
    !h5pId ||
    !timestamp
  ) {
    logger.debug(
      `xAPI event didn't include all required info (roomId:${roomId}, ` +
        `userId:${userId}, h5pId:${h5pId}, timestamp:${timestamp}). Skipping...`,
    )
    return null
  }

  const contentTypeCategories = statement.context?.contextActivities?.category
  const categoryId = contentTypeCategories?.[0]?.id

  let h5pType: string | undefined
  if (categoryId) {
    const results = categoryRegex.exec(categoryId)
    h5pType = (results && results[1]) || undefined
  }

  // For some reason, the 1st level subcontent doesn't include a parentId.
  let h5pParentId: string | undefined
  const fullParentId = statement.context?.contextActivities?.parent?.[0]?.id
  if (fullParentId) {
    const parentIdStartIndex = fullParentId.indexOf('=') + 1
    h5pParentId = fullParentId.substring(parentIdStartIndex)
  } else if (h5pSubId !== undefined) {
    h5pParentId = h5pId
  }

  const h5pName = statement.object.definition.name?.['en-US']
  const verb = statement.verb?.display?.['en-US']
  const response = statement.result?.response
  const score = statement.result?.score

  return {
    entryId,
    userId,
    roomId,
    h5pId,
    h5pSubId,
    h5pType,
    h5pName,
    h5pParentId,
    score,
    response,
    verb,
    timestamp,
    authenticationToken,
  }
}

@Service()
export class XapiEventProcessor {
  constructor(
    @InjectRepository(RawAnswer, ASSESSMENTS_CONNECTION_NAME)
    private readonly rawAnswerRepo: Repository<RawAnswer>,
    @InjectRepository(Room, ASSESSMENTS_CONNECTION_NAME)
    private readonly roomRepo: Repository<Room>,
    private roomScoresTemplateProvider: RoomScoresTemplateProvider,
  ) {}

  public async process(
    events: StreamMessageReply[],
    xClient: RedisStreams,
    stream: string,
    errorStream: string,
    group: string,
  ): Promise<void> {
    logger.debug(`process >> events received: ${events.length}`)

    // 1. Separate VALID from the INVALID events
    const validXapiEvents: XApiRecordEvent[] = []
    const invalidXapiEvents: StreamMessageReply[] = []
    events.forEach(({ id, message }) => {
      const data = message?.data
      try {
        const valid = parseRawEvent(JSON.parse(data), id)
        if (valid) {
          validXapiEvents.push(valid)
        } else {
          invalidXapiEvents.push({
            id,
            message: { data, reason: 'Missing required fields' },
          })
        }
      } catch (e) {
        invalidXapiEvents.push({ id, message: { data, error: e.message } })
      }
    })
    logger.debug(
      `process >> events ${validXapiEvents.length}/${events.length} VALID +` +
        ` ${invalidXapiEvents.length}/${events.length} INVALID`,
    )

    // 1.1 Send the invalid events to the error queue and acknowledge them
    if (invalidXapiEvents.length > 0) {
      try {
        await Promise.all(
          invalidXapiEvents.map(async (event) => {
            xClient.add(errorStream, event.message)
          }),
        )
        const invalidEventsIds = invalidXapiEvents.map((x) => x.id)
        await xClient.ack(stream, group, invalidEventsIds)
        logger.debug(
          `process >> ${invalidXapiEvents.length} invalid events acknowledged` +
            ` and pushed to error stream(${errorStream})`,
        )
      } catch (error) {
        logger.error('Failed to acknowledge invalidXapiEvents.', {
          error: error.message,
        })
      }
    }

    if (validXapiEvents.length === 0) {
      return
    }

    const eventsWithRoomIdAndAuthToken: XApiRecordEvent[] = []
    const contentKeySet = new Set<string>()
    const eventsWithAnswers: XApiRecordEvent[] = []
    const eventsWithNoAnswers: XApiRecordEvent[] = []
    for (const xapiEvent of validXapiEvents) {
      if (xapiEvent.response || xapiEvent.score) {
        eventsWithAnswers.push(xapiEvent)
        const contentKey = ContentKey.construct(
          xapiEvent.h5pId,
          xapiEvent.h5pSubId,
        )
        contentKeySet.add(contentKey)
      } else {
        eventsWithNoAnswers.push(xapiEvent)
      }
      if (xapiEvent.authenticationToken && xapiEvent.roomId) {
        eventsWithRoomIdAndAuthToken.push(xapiEvent)
      }
    }

    if (eventsWithAnswers.length > 0) {
      logger.info(
        `xAPI events with answers: ${eventsWithAnswers.length}`,
        eventsWithAnswers,
      )
    }

    // If we don't have any answers for a given contentKey, add a non-answer event
    // so the consumer knows that the activity was at least seen/attempted.
    for (const xapiEvent of eventsWithNoAnswers) {
      const contentKey = ContentKey.construct(
        xapiEvent.h5pId,
        xapiEvent.h5pSubId,
      )
      if (!contentKeySet.has(contentKey)) {
        contentKeySet.add(contentKey)
        // timestamp is part of the composite primary key, so we set it to zero
        // for "events with no answers" to signify that we only care about one
        // event per contentKey. The insert statement will conflict and be ignored.
        xapiEvent.timestamp = 0
        eventsWithAnswers.push(xapiEvent)
      }
    }
    // Now convert the events to RawAnswers for the database.
    const rawAnswers = eventsWithAnswers.map((x) =>
      this.rawAnswerRepo.create({
        roomId: x.roomId,
        studentId: x.userId,
        h5pId: x.h5pId,
        h5pSubId: x.h5pSubId,
        timestamp: x.timestamp,
        answer: x.response,
        score: x.score?.raw,
        maximumPossibleScore: x.score?.max,
        minimumPossibleScore: x.score?.min,
      }),
    )

    // 7. Acknowledge
    logger.debug(
      `process >> Redis acknowledge processed events: ${validXapiEvents.length}`,
    )
    await xClient.ack(
      stream,
      group,
      validXapiEvents.map((x) => x.entryId),
    )

    await this.rawAnswerRepo
      .createQueryBuilder()
      .insert()
      .into(RawAnswer)
      .values(rawAnswers)
      .orIgnore()
      .execute()

    try {
      await this.createRoom(eventsWithRoomIdAndAuthToken)
    } catch (error) {
      logger.error('room creation failed', { error: error.message })
    }
  }

  /**
   * Create Room and UserContentScore templates ahead of time.
   * It's better to do it now than when users are waiting.
   * Template creation involves calls to the CMS and H5P services.
   * It's okay if this fails because the the API will detect and handle accordingly.
   */
  private async createRoom(
    eventsWithRoomIdAndAuthToken: ReadonlyArray<XApiRecordEvent>,
  ) {
    for (const {
      roomId,
      authenticationToken,
    } of eventsWithRoomIdAndAuthToken) {
      const existingRoom = await this.roomRepo.findOne(roomId, {
        select: ['roomId'],
      })
      if (existingRoom) {
        continue
      }
      const userContentScoreTemplates =
        await this.roomScoresTemplateProvider.getTemplates(
          roomId,
          authenticationToken,
        )
      const room = new Room(roomId)
      room.scores = Promise.resolve(userContentScoreTemplates)
      await this.roomRepo.save(room)
      logger.info(`room created: ${roomId}`)
    }
  }
}
