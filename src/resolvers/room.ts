import { Arg, Query, Resolver, Authorized, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Answer, RawAnswer, Room } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { Context } from '../auth/context'
import { RoomScoresTemplateProvider } from '../providers/roomScoresTemplateProvider'
import { Benchmark } from '../helpers/benchmarkMiddleware'
import ContentKey from '../helpers/contentKey'

const logger = withLogger('RoomResolver')

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    private readonly roomScoresTemplateProvider: RoomScoresTemplateProvider,
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
      let room = await this.assessmentDB.findOne(Room, roomId)

      const roomSaved = room != null
      if (!room) {
        room = new Room(roomId)
        logger.warn(`Room >> roomId: ${roomId} >> created new Room`)
        const userContentScoreTemplates =
          await this.roomScoresTemplateProvider.getTemplates(
            roomId,
            context.encodedAuthenticationToken,
          )
        room.scores = Promise.resolve(userContentScoreTemplates)
      }
      if (room.assessmentVersion === 1) {
        logger.verbose(`Room ${roomId} is v1. Returning cached results.`)
        return room
      }

      // Optimization.
      const existingAnswerCount = await this.assessmentDB.count(Answer, {
        where: { roomId },
      })
      const allRawAnswers = await this.assessmentDB.find(RawAnswer, {
        where: { roomId },
      })
      if (allRawAnswers.length === existingAnswerCount) {
        if (!roomSaved) {
          await this.assessmentDB.save(room)
        }
        return room
      }

      const userContentScores = (await room.scores) ?? []
      logger.verbose('existingScores.seen', {
        roomId,
        seen: userContentScores.map((x) => {
          return {
            seen: x.seen,
            contentKey: x.contentKey,
            studentId: x.studentId,
          }
        }),
      })
      const mapKeyToUserContentScoreMap = new Map(
        userContentScores
          .filter((x) => x.h5pId)
          .map((x) => {
            const mapKey = RoomScoresTemplateProvider.getMapKey(
              roomId,
              x.studentId,
              ContentKey.construct(x.h5pId!, x.h5pSubId),
            )
            return [mapKey, x]
          }),
      )

      const mapKeyToRawAnswersMap = new Map<string, RawAnswer[]>()
      for (const rawAnswer of allRawAnswers) {
        const mapKey = RoomScoresTemplateProvider.getMapKey(
          roomId,
          rawAnswer.studentId,
          ContentKey.construct(rawAnswer.h5pId, rawAnswer.h5pSubId),
        )
        const entry = mapKeyToRawAnswersMap.get(mapKey) ?? []
        if (entry.length === 0) {
          mapKeyToRawAnswersMap.set(mapKey, entry)
        }
        entry.push(rawAnswer)
      }
      for (const [mapKey, rawAnswers] of mapKeyToRawAnswersMap.entries()) {
        const ucs = mapKeyToUserContentScoreMap.get(mapKey)
        if (!ucs) {
          logger.error(
            "Received event for room but the material isn't part of the lesson plan.",
            {
              roomId,
              h5pId: rawAnswers[0].h5pId,
              h5pSubId: rawAnswers[0].h5pSubId,
            },
          )
          continue
        }
        ucs.applyAnswers(rawAnswers)
      }

      room.scores = Promise.resolve(userContentScores)
      await this.assessmentDB.save(room)

      return room
    } catch (e) {
      logger.error(e)
      throw e
    }
  }
}
