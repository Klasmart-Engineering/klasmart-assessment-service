import { XApiRecord } from '../db/xapi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
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
        `process >> ${invalidXapiEvents.length} invalid events acknowledged` +
          ` and pushed to error strea(${errorStream})`,
      )
    }

    // Special case handling ******************************************
    addDummyEventsToAccountForActivitiesWithNoEvents(validXapiEvents)
    populateUndefinedH5pTypesWithParentType(validXapiEvents)
    // ****************************************************************

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
            userContentScore.seen = true
            await this.assessmentDB.save(UserContentScore, userContentScore)
            room.scores = Promise.resolve([
              ...(await room.scores),
              userContentScore,
            ])
          }

          await Promise.all([
            xapiEvents.map((a) => {
              return userContentScore!.applyEvent(a)
            }),
          ])
          await this.assessmentDB.save(Answer, await userContentScore.answers)

          // 7. Acknowledge
          logger.info(
            `process >> Redis acknolewdge processed events: ${xapiEvents.length}`,
          )
          const nonDummyEvents = xapiEvents.filter((x) => x.entryId !== '-1')
          if (nonDummyEvents.length > 0) {
            await xClient.ack(
              stream,
              group,
              nonDummyEvents.map((x) => x.entryId),
            )
          }
        }
      }
      await this.assessmentDB.save(room)
    }
  }
}

// https://calmisland.atlassian.net/browse/KLA-252
function addDummyEventsToAccountForActivitiesWithNoEvents(
  xapiEvents: XApiRecordEvent[],
) {
  const contentKeyHash = new Set<string>()
  for (const x of xapiEvents) {
    if (!x.h5pSubId) continue
    const contentKey = ContentKey.construct(x.h5pId, x.h5pSubId)
    if (contentKeyHash.has(contentKey)) continue
    contentKeyHash.add(contentKey)

    // Originally, sub-activities only generated a UserContentScore if an xAPI was received for it.
    // Because without a subcontent API, we can't know about it.
    // But now we use the fact that an xAPI event will include a parent ID if the activity
    // that generated the event is a sub-activity. So we now use that parent ID to generate a
    // UserContentScore for that parent, even though the parent may not emit an event.
    if (x.h5pParentId && x.h5pParentId !== x.h5pId) {
      xapiEvents.push({
        entryId: '-1',
        h5pId: x.h5pId,
        roomId: x.roomId,
        timestamp: x.timestamp,
        userId: x.userId,
        h5pSubId: x.h5pParentId,
        h5pParentId: x.h5pId,
      })
    }
  }
}

// https://calmisland.atlassian.net/browse/DAS-353
function populateUndefinedH5pTypesWithParentType(
  xapiEvents: ReadonlyArray<ParsedXapiEvent>,
) {
  const h5pWithChildren = new Set<string>()
  for (const x of xapiEvents) {
    if (x.h5pParentId != null) {
      h5pWithChildren.add(x.h5pParentId)
    }
  }
  const parentKeyToEventMap = new Map<string, ParsedXapiEvent>()
  for (const x of xapiEvents) {
    if (
      !x.h5pSubId &&
      h5pWithChildren.has(x.h5pId) &&
      !parentKeyToEventMap.has(x.h5pId)
    ) {
      parentKeyToEventMap.set(x.h5pId, x)
    }
    if (
      x.h5pSubId &&
      h5pWithChildren.has(x.h5pSubId) &&
      !parentKeyToEventMap.has(`${x.h5pId}|${x.h5pSubId}`)
    ) {
      parentKeyToEventMap.set(`${x.h5pId}|${x.h5pSubId}`, x)
    }
  }
  for (const x of xapiEvents) {
    if (x.h5pSubId == null) {
      continue
    }
    let current: ParsedXapiEvent | undefined = x
    while (current != null && current.h5pType == null) {
      const key =
        current.h5pParentId === current.h5pId
          ? current.h5pId
          : `${current.h5pId}|${current.h5pParentId}`
      const parent = parentKeyToEventMap.get(key)
      current.h5pType = parent?.h5pType
      if (current.h5pType == null) {
        current = parent
      }
    }
  }
}
