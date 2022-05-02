import { XApiRecord } from '../db/xapi'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'
import { Answer, Room, UserContentScore } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { EntityManager, Repository } from 'typeorm'
import { UserContentScoreFactory } from '../providers/userContentScoreFactory'
import ContentKey from '../helpers/contentKey'
import { RedisStreams, StreamMessageReply } from './redisApi'

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
}

export const parseRawEvent = (
  rawXapiEvent?: XApiRecord,
): ParsedXapiEvent | null => {
  const userId = rawXapiEvent?.userId
  const roomId = rawXapiEvent?.roomId
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
    const regex = new RegExp(`^http://h5p.org/libraries/H5P.(.+)-\\d+.\\d+$`)
    const results = regex.exec(categoryId)
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
  }
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
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
    public readonly userContentScoreFactory: UserContentScoreFactory,
    @InjectRepository(Room, ASSESSMENTS_CONNECTION_NAME)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserContentScore, ASSESSMENTS_CONNECTION_NAME)
    private readonly userContentScoreRepository: Repository<UserContentScore>,
    @InjectRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
    private readonly answerRepository: Repository<Answer>,
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    public readonly assessmentDB: EntityManager,
  ) {}

  public static getUserContentScoreKey(
    roomId: string,
    userId: string,
    contentKey: string,
  ): string {
    return `${roomId}|${userId}|${contentKey}`
  }

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
    logger.info(`process >> events received: ${events.length}`)

    // 1. Separate VALID from the INVALID events
    const validXapiEvents: XApiRecordEvent[] = []
    const invalidXapiEvents: StreamMessageReply[] = []
    events.forEach(({ id, message }) => {
      const data = message?.data
      try {
        const valid = parseRawEvent(JSON.parse(data))
        if (valid) {
          validXapiEvents.push({ ...valid, entryId: id })
        } else {
          invalidXapiEvents.push({
            id,
            message: { data, error: 'Invalid JSON' },
          })
        }
      } catch (e) {
        invalidXapiEvents.push({ id, message: { data, error: String(e) } })
      }
    })
    logger.info(
      `process >> events ${validXapiEvents.length}/${events.length} VALID +` +
        ` ${invalidXapiEvents.length}/${events.length} INVALID`,
    )

    // 1.1 Send the invalid events to the error queue and acknolewdge them
    if (invalidXapiEvents.length > 0) {
      await Promise.all(
        invalidXapiEvents.map(async (event) => {
          xClient.add(errorStream, event.message)
        }),
      )
      const invalidEventsIds = invalidXapiEvents.map((x) => x.id)
      await xClient.ack(stream, group, invalidEventsIds)
      logger.info(
        `process >> ${invalidXapiEvents.length} invalid events aknowledged` +
          ` and pushed to error strea(${errorStream})`,
      )
    }

    // 2. Group by Room
    const xapiEventsGroupedByRoom = groupBy(
      validXapiEvents,
      (xapiEvent) => xapiEvent.roomId,
    )
    logger.info(
      `process >> valid events grouped by roomId,` +
        ` total groups: ${xapiEventsGroupedByRoom.size}`,
    )

    for (const [roomId, xapiEvents] of xapiEventsGroupedByRoom.entries()) {
      logger.info(
        `process >> roomId(${roomId}) >> events: ${xapiEvents.length}`,
      )

      // Get the room or create a new one
      // let room = await this.assessmentDB.findOne(Room, roomId, {})
      let room = await this.roomRepository.findOne(roomId)
      if (!room) {
        room = new Room(roomId)
        await this.assessmentDB.save(Room, room)
        logger.debug(`process >> roomId(${roomId}) >> created new Room`)
      }

      // 3. Group by user
      const xapiEventsGroupedByUser = groupBy(
        xapiEvents,
        (xapiEvent) => xapiEvent.userId,
      )
      logger.info(
        `process >> Grouped by userId, total groups: ${xapiEventsGroupedByUser.size}`,
      )

      for (const [userId, xapiEvents] of xapiEventsGroupedByUser.entries()) {
        logger.info(
          `process >> roomId(${roomId}) userId(${userId}) >>` +
            ` events: ${xapiEvents.length}`,
        )
        const xapiEventsGroupedByContentKey = groupBy(
          xapiEvents,
          (xapiEvent) =>
            ContentKey.construct(xapiEvent.h5pId, xapiEvent.h5pSubId), // old way -> Material:content_id + xapiEvent:h5pSubId
        )
        logger.info(
          `process >> Grouped by contentKey, ` +
            `total groups: ${xapiEventsGroupedByContentKey.size}`,
        )

        // 4. Group by activity/content
        for (const [
          contentKey,
          xapiEvents,
        ] of xapiEventsGroupedByContentKey.entries()) {
          logger.info(
            `process >> roomId(${roomId}) userId(${userId}) ` +
              `contentKey(${contentKey}) >> events: ${xapiEvents.length}`,
          )

          // Sanity check, should be IMPOSSIBLE -> ContentKey should not exist for events that don't exist
          if (xapiEvents.length == 0) {
            logger.error(`process >> No events found after groupby!`)
            continue
          }

          // At this point, xapi events that share the same h5pId and h5pSubId
          // must also have the same Type, Name and h5pParentId
          const { h5pType, h5pName, h5pParentId } = xapiEvents[0]

          logger.debug(
            `process >> userContentScore(${roomId}:${userId}:${contentKey})`,
          )
          // Time for the UserContentScore entity!
          // First, let's try to find one in the database if it already exists
          let userContentScore = await this.assessmentDB.findOne(
            UserContentScore,
            {
              where: {
                roomId: roomId,
                studentId: userId,
                contentKey: contentKey,
              },
            },
          )

          // If we haven't found one, we will create a new one
          if (!userContentScore) {
            logger.debug(
              `process >> creating a new userContentScore(${roomId}:${userId}:${contentKey})`,
            )
            userContentScore = this.userContentScoreFactory.create(
              roomId,
              userId,
              contentKey,
              h5pType,
              h5pName,
              h5pParentId,
            )
            await this.assessmentDB.save(UserContentScore, userContentScore)
            room.scores = Promise.resolve([
              ...(await room.scores),
              userContentScore,
            ])
          }

          // 5. Filter out events that don't have a score or a response
          const xapiEventsWithAnswers = xapiEvents.filter(
            (xapiEvent) =>
              !(
                xapiEvent.score === undefined &&
                xapiEvent.response === undefined
              ),
          )

          if (xapiEventsWithAnswers.length < xapiEvents.length) {
            logger.warn(
              `process >> (${roomId}:${userId}:${contentKey}) >> ` +
                `${xapiEvents.length - xapiEventsWithAnswers.length}/` +
                `${xapiEvents.length} events don't have a score and response fields ` +
                `>> are filtered out`,
            )
          }

          // 6. Create new Answer records
          const newAnswers = xapiEventsWithAnswers.map((xapiEvent) => {
            const answer = Answer.new(
              userContentScore!,
              new Date(xapiEvent.timestamp),
              xapiEvent.response,
              // TODO: Maybe pass whole score object, instead.
              xapiEvent.score?.raw,
              xapiEvent.score?.min,
              xapiEvent.score?.max,
            )
            return answer
          })

          logger.info(`process >> total new Answers: ${newAnswers.length}`)
          await Promise.all(
            newAnswers.map(async (a) => {
              await this.assessmentDB.save(Answer, a)
              await userContentScore!.addReadyAnswer(a)
            }),
          )

          // 7. Acknolewdge
          logger.info(
            `process >> Redis acknolewdge processed events: ${xapiEvents.length}`,
          )
          await xClient.ack(
            stream,
            group,
            xapiEvents.map((x) => x.entryId),
          )
        }
      }
      await this.assessmentDB.save(room)
    }
  }
}
