import { Arg, Query, Resolver, Authorized, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Room } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { RoomScoresCalculator } from '../providers/roomScoresCalculator'
import { Context } from '../auth/context'
import { RoomScoresTemplateProvider } from '../providers/roomScoresTemplateProvider'
import { Benchmark } from '../helpers/benchmarkMiddleware'

const logger = withLogger('RoomResolver')

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
  ) {}

  @Benchmark()
  @Authorized()
  @Query(() => Room)
  public async Room(
    @Arg('room_id') roomId: string,
    @Ctx() context: Context,
  ): Promise<Room> {
    logger.debug(`Room >> roomId: ${roomId}`)
    try {
      let room = await this.assessmentDB.findOne(Room, roomId, {})

      if (!room) {
        room = new Room(roomId)
        logger.warn(`Room >> roomId: ${roomId} >> created new Room`)
      }

      /**
       * merge existing scores calculated from xapi events (+ cached getMaterials scores)
       * and new scores calculated from the materials or lesson plan
       */
      const existingScores = (await room.scores) ?? []
      logger.verbose('existingScores.seen', {
        roomId,
        seen: existingScores.map((x) => {
          return {
            seen: x.seen,
            contentKey: x.contentKey,
            studentId: x.studentId,
          }
        }),
      })
      const newScores = await this.roomScoresCalculator.calculate(
        roomId,
        context.encodedAuthenticationToken,
      )
      logger.debug(
        `existingScores num: ${existingScores.length}, newScores num: ${newScores.length}`,
      )
      const mapKeyToNewScoreMap = new Map(
        newScores.map((x) => {
          const mapKey = RoomScoresTemplateProvider.getMapKey(
            roomId,
            x.studentId,
            x.contentKey,
          )
          return [mapKey, x]
        }),
      )
      // Start with newScores because these are in lesson plan order.
      const scoresToUpsert = [...newScores]
      for (const existingScore of existingScores) {
        const mapKey = RoomScoresTemplateProvider.getMapKey(
          roomId,
          existingScore.studentId,
          existingScore.contentKey,
        )
        const newScore = mapKeyToNewScoreMap.get(mapKey)
        if (!newScore) {
          logger.error(
            "Received event for room but the material isn't part of the lesson plan.",
            { roomId, contentKey: existingScore.contentKey },
          )
          continue
        }
        newScore.seen = existingScore.seen
        newScore.answers = existingScore.answers
        newScore.teacherScores = existingScore.teacherScores
      }

      room.scores = Promise.resolve(scoresToUpsert)
      await this.assessmentDB.save(room)

      return room
    } catch (e) {
      logger.error(e)
      throw e
    }
  }
}
