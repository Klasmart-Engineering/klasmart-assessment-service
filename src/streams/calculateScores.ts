import { XApiRecord } from '../db/xapi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { Repository } from 'typeorm'
import ContentKey from '../helpers/contentKey'
import { RedisStreams, StreamMessageReply } from './redisApi'
import { RawAnswer } from '../db/assessments/entities/rawAnswer'
import { RoomScoresCalculator } from '../providers/roomScoresCalculator'
import { Room } from '../db/assessments/entities'

const logger = withLogger('streamCalculateScore')

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
    logger.error(
      `XAPI event didn't include all required info (roomId:${roomId}, ` +
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

function groupBy<K, V>(
  list: Array<V>,
  keyGetter: (input: V) => K,
): Map<K, Array<V>> {
  const map = new Map()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

@Service()
export class RoomScoresTemplateProvider2 {
  constructor(
    @InjectRepository(RawAnswer, ASSESSMENTS_CONNECTION_NAME)
    private readonly rawAnswerRepo: Repository<RawAnswer>,
    @InjectRepository(RawAnswer, ASSESSMENTS_CONNECTION_NAME)
    private readonly roomRepo: Repository<Room>,
    private roomScoresCalculator: RoomScoresCalculator,
  ) {}

  // 1 rooms -> 10 students -> 1 events every 10s => 1 event/second
  // 10 rooms -> fine
  // 100 rooms ->fine
  // 1000 rooms -> ok maybe it's fine
  // 10000 rooms => probably slows down

  // ! DOES NOT QUERY THE CMS SERVICE

  // xapi events -> room_id, user_id, content_key = (h5p_id + h5p_sub_id)
  //   -> process
  //   -> room(room_id) + userContentScore(user_id, content_key)
  //   -> xapiEvent -> userContentScore -> @oneToMany(Answers)

  // ACTION plan:
  // -> save/upsert at the very end so that all the edits happen in one go
  // -> don't read
  // -> add try/catch + retry logic (3-5 times) with delay logic (exponential decayed delay 1-2-3-5-10 seconds) -> delay only on retries
  // -> multiple failures -> pop into failure queue
  // => [refactor in API] query CMS with room_id => list of lesson materials => map h5pIds to CMS content ids (no caching for now)
  // => add event stream producer logic to live-backend service
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
            message: { data, error: 'Invalid JSON' },
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
        // event per contentKey.
        xapiEvent.timestamp = 0
        eventsWithAnswers.push(xapiEvent)
      }
    }

    let rawAnswers: RawAnswer[] = []
    try {
      // Now convert the events to RawAnswers for the database.
      rawAnswers = eventsWithAnswers.map((x) =>
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
    } catch (error) {
      logger.error('rawAnswerRepo.create failed', {
        error: error.message,
        events: eventsWithAnswers,
      })
    }
    if (rawAnswers.length > 0) {
      try {
        await this.rawAnswerRepo
          .createQueryBuilder()
          .insert()
          .into(RawAnswer)
          .values(rawAnswers)
          .orIgnore()
          .execute()
      } catch (error) {
        logger.error('rawAnswerRepo.insert failed', {
          error: error.message,
          rawAnswers,
        })
      }
    }

    // 7. Acknowledge
    logger.debug(
      `process >> Redis acknowledge processed events: ${validXapiEvents.length}`,
    )
    await xClient.ack(
      stream,
      group,
      validXapiEvents.map((x) => x.entryId),
    )

    try {
      await this.createRoom(eventsWithRoomIdAndAuthToken)
    } catch (error) {
      logger.error('room creation failed', error)
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
        await this.roomScoresCalculator.calculate(roomId, authenticationToken)
      const room = new Room(roomId)
      room.scores = Promise.resolve(userContentScoreTemplates)
      await this.roomRepo.save(room)
      logger.info(`room created: ${roomId}`)
    }
  }
}
