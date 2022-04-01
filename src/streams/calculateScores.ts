import { XApiRecord } from '../db/xapi'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'
import { Answer, Room, UserContentScore } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { EntityManager, InsertQueryBuilder, Repository } from 'typeorm'
import { UserContentScoreFactory } from '../providers/userContentScoreFactory'
import ContentKey from '../helpers/contentKey'
import { RoomBuilder } from '../../tests/builders'

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
    // @InjectRepository(UserContentScore, ASSESSMENTS_CONNECTION_NAME)
    // private readonly userContentScoreRepository: Repository<UserContentScore>,
    public readonly userContentScoreFactory: UserContentScoreFactory,
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

  public async process(rawXapiEvents: XApiRecord[]): Promise<void> {
    // create a map of <room-user-contentKey, UserContentScore>
    // const mapKeyToUserContentScoreMap: Map<string, UserContentScore> = new Map()

    // (1.) query CMS -> xapiEvent:h5pId <=> Material:content_id
    // (2.) during Assessment API query, grab existing UserContentScores based on xapiEvents
    //      and geenrate new UserContentScores for non-h5p activities (such as pdf-activity)
    //      which didn't generate any xapiEvents. This would allow Teacher to add manual
    //      scores and comments.
    console.log('this =================>', this)

    logger.debug(`setup >> rawXapiEvents received: ${rawXapiEvents.length}`)

    // 1. Parse all the xapi events
    const xapiEvents = rawXapiEvents
      .map((event) => parseRawEvent(event))
      .filter(notEmpty)

    logger.debug(`setup >> parsing DONE, total events: ${xapiEvents.length}`)
    // 2. Group the events by `roomId`, `userId` and `contentId`
    //    with`contentId` => is a composed of the `h5pId` or `h5pId + h5pSubId`
    // 2.1 Group by room
    const xapiEventsGroupedByRoom = groupBy(
      xapiEvents,
      (xapiEvent) => xapiEvent.roomId,
    )

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

    logger.debug(
      `setup >> Grouped by roomId, total groups: ${xapiEventsGroupedByRoom.size}`,
    )
    // Execute all sql inserts in a transaction
    await this.assessmentDB.transaction(async (transactionalEntityManager) => {
      for (const roomId of xapiEventsGroupedByRoom.keys()) {
        logger.debug(`setup >> roomId: ${roomId}`)

        // Get the room or create a new one
        let room = await this.assessmentDB.findOne(Room, roomId, {})
        if (!room) {
          room = new Room(roomId)
          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(Room)
            .values(room!)
            .execute()

          logger.debug(`Room >> roomId: ${roomId} >> created new Room`)
        }
        const roomScores: UserContentScore[] = []

        // 2.1 Group by user
        const xapiEvents = xapiEventsGroupedByRoom.get(roomId)!
        const xapiEventsGroupedByUser = groupBy(
          xapiEvents,
          (xapiEvent) => xapiEvent.userId,
        )
        logger.debug(
          `setup >> Grouped by userId, total groups: ${xapiEventsGroupedByUser.size}`,
        )

        for (const userId of xapiEventsGroupedByUser.keys()) {
          logger.debug(`setup >> roomId: ${roomId} >> userId: ${userId}`)
          const xapiEvents = xapiEventsGroupedByUser.get(userId)!
          const xapiEventsGroupedByContentKey = groupBy(
            xapiEvents,
            (xapiEvent) =>
              ContentKey.construct(xapiEvent.h5pId, xapiEvent.h5pSubId), // (3.) old way -> Material:content_id + xapiEvent:h5pSubId
          )
          logger.debug(
            `setup >> Grouped by contentKey, total groups: ${xapiEventsGroupedByContentKey.size}`,
          )

          // 2.3 Group by activity/content
          for (const contentKey of xapiEventsGroupedByContentKey.keys()) {
            logger.debug(
              `setup >> roomId: ${roomId} >> userId: ${userId} >> contentKey ${contentKey}`,
            )

            const xapiEvents = xapiEventsGroupedByContentKey.get(contentKey)!

            // THIS IS IMPOSSIBLE -> ContentKey should not exist for events that don't exist
            if (xapiEvents.length == 0) {
              logger.warn(`setup >> No event FOUND FOR SOME REASON ?!?!??!?!`)
              continue
            }

            // At this point, xapi events that share the same h5pId and h5pSubId
            // must also have the same Type, Name and h5pParentId
            const { h5pType, h5pName, h5pParentId } = xapiEvents[0]

            logger.debug(`setup >> time for the userContentScore`)
            // Time for the UserContentScore entity!
            // First, let's try to find one in the database if it already exists
            let userContentScore = await this.assessmentDB
              .getRepository(UserContentScore)
              .findOne({
                where: {
                  roomId: roomId,
                  studentId: userId,
                  contentKey: contentKey,
                },
              })

            // If we haven't found one, we will create a new one
            if (!userContentScore) {
              logger.debug(`setup >> creating a new userContentScore`)
              userContentScore = this.userContentScoreFactory.create(
                roomId,
                userId,
                contentKey,
                h5pType,
                h5pName,
                h5pParentId,
              )
              // queries.push(async (dataSource) => {
              //   await dataSource
              //     .createQueryBuilder()
              //     .insert()
              //     .into(UserContentScore)
              //     .values(userContentScore!)
              //     .execute()
              // })
            } else {
              const answers = await userContentScore.answers
              logger.debug(
                `setup >> userContentScore already exists and holds ${answers?.length} answers`,
              )
            }
            roomScores.push(userContentScore)
            await transactionalEntityManager.save(userContentScore)

            const scoreAnswers: Answer[] = []
            for (const xapiEvent of xapiEvents) {
              logger.debug(`setup >> applying xapiEvent to userContentScore`)
              const answer = await userContentScore.applyEvent(xapiEvent)
              if (answer) {
                scoreAnswers.push(answer)
                await transactionalEntityManager.save(answer)
              }
            }
            logger.warn(`setup > scoreAnswers length: ${scoreAnswers.length}`)
            // userContentScore.answers = Promise.resolve(scoreAnswers)
            await transactionalEntityManager.save(userContentScore)
            // logger.warn(`===============================================`)
            // logger.warn(`===============================================`)
            // logger.warn(`===============================================`)
            // console.log(userContentScore)
            // const fromDbUcs = await transactionalEntityManager
            //   .getRepository(UserContentScore)
            //   .findOne({
            //     where: {
            //       roomId: roomId,
            //       studentId: userId,
            //       contentKey: contentKey,
            //     },
            //   })
            // logger.warn(`mmmmmmmmmmmmm`)
            // logger.warn(`mmmmmmmmmmmmm`)
            // logger.warn(`mmmmmmmmmmmmm`)
            // console.log(fromDbUcs)
            room.scores = Promise.resolve(roomScores)
            await transactionalEntityManager.save(room)
          }
        }
      }
    })
  }

  // TODO: delete
  public async getRoom({ roomId }: any) {
    console.log('getRoom > input:', { roomId })
    const room: Room = await this.assessmentDB.findOne(Room, roomId, {})
    console.log('getRoom > room:', room)
    const userContentScores = await room.scores
    console.log('getRoom > userContentScores:', userContentScores)
    const answers = await userContentScores[0].answers
    console.log('getRoom > answers:', answers)
  }

  // TODO: delete
  public async checkExistence({ roomId, userId, h5pId }: any) {
    console.log('checkExistence > input:', { roomId, userId, h5pId })
    // const userContentScores = await this.userContentScoreRepository.find({
    //   where: {
    //     roomId: roomId,
    //     studentId: userId,
    //     contentKey: h5pId,
    //   },
    // })

    const userContentScores = await this.assessmentDB
      .getRepository(UserContentScore)
      .createQueryBuilder('score')
      .where('score.roomId = :roomId', { roomId })
      .andWhere('score.studentId = :userId', { userId })
      .andWhere('score.contentKey = :h5pId', { h5pId })
      .getMany()

    console.log('checkExistence > userContentScores:', userContentScores)
    const answers = await userContentScores[0].answers
    console.log('checkExistence > --------------------------------->')
    console.log('checkExistence > Found number Answers =>', answers?.length)
    console.log('checkExistence > Answers =>', answers)
  }
}
