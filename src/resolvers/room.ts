import {
  Arg,
  FieldResolver,
  Query,
  Resolver,
  Root,
  Authorized,
  Ctx,
} from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Room } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { ContentScores, UserScores, TeacherCommentsByStudent } from '../graphql'
import { RoomScoresCalculator } from '../providers/roomScoresCalculator'
import { Context } from '../auth/context'

const logger = withLogger('RoomResolver')

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
  ) {}

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
      const newScores = await this.roomScoresCalculator.calculate(
        roomId,
        context.encodedAuthenticationToken,
      )
      logger.debug(
        `existingScores num: ${existingScores.length}, newScores num: ${newScores.length}`,
      )
      const allScores = [...existingScores, ...newScores].filter(
        (val, idx, self) => {
          const index = self.findIndex(
            (t) =>
              t.roomId === val.roomId &&
              t.studentId === val.studentId &&
              t.contentKey === val.contentKey,
          )
          return idx === index
        },
      )
      logger.debug(`allScores num: ${allScores.length}`)

      if (existingScores.length !== allScores.length) {
        room.scores = Promise.resolve(allScores)
        await this.assessmentDB.save(room)
      }

      logger.debug(`Room >> roomId: ${roomId} >> updated Room`)
      return room
    } catch (e) {
      logger.error(e)
      throw e
    }
  }

  @FieldResolver(() => [UserScores])
  public async scoresByUser(
    @Root() room: Room,
  ): Promise<ReadonlyArray<UserScores>> {
    logger.debug(`Room room_id: ${room.roomId} >> scoresByUser`)

    const scoresByUser: Map<string, UserScores> = new Map()

    const allScores = await room.scores
    for (const userContentScore of allScores) {
      const userScores = scoresByUser.get(userContentScore.studentId)
      if (userScores) {
        userScores.scores.push(userContentScore)
      } else {
        scoresByUser.set(
          userContentScore.studentId,
          new UserScores(userContentScore.studentId, [userContentScore]),
        )
      }
    }
    logger.debug(
      `Room >> scoresByUser >> users count: ${scoresByUser.size}, ` +
        `total scores count: ${allScores.length}`,
    )

    return [...scoresByUser.values()]
  }

  @FieldResolver(() => [ContentScores])
  public async scoresByContent(
    @Root() room: Room,
  ): Promise<ReadonlyArray<ContentScores>> {
    logger.debug(`Room room_id: ${room.roomId} >> scoresByContent`)

    const scoresByContent: Map<string, ContentScores> = new Map()

    const allScores = await room.scores
    for (const userContentScore of allScores) {
      const contentScores = scoresByContent.get(userContentScore.contentKey)
      if (contentScores) {
        contentScores.scores.push(userContentScore)
      } else {
        scoresByContent.set(
          userContentScore.contentKey,
          new ContentScores(
            userContentScore.contentKey,
            [userContentScore],
            userContentScore.contentType,
            userContentScore.contentName,
            userContentScore.contentParentId,
          ),
        )
      }
    }
    logger.debug(
      `Room room_id: ${room.roomId} >> scoresByContent >> ` +
        `content count: ${scoresByContent.size}, ` +
        `total scores count: ${allScores.length}`,
    )

    return [...scoresByContent.values()]
  }

  @FieldResolver(() => [TeacherCommentsByStudent])
  public async teacherCommentsByStudent(
    @Root() room: Room,
  ): Promise<ReadonlyArray<TeacherCommentsByStudent>> {
    logger.debug(`Room room_id: ${room.roomId} >> teacherCommentsByStudent`)
    const commentsByStudent: Map<string, TeacherCommentsByStudent> = new Map()

    const allTeacherComments = await room.teacherComments
    for (const comment of await room.teacherComments) {
      const teacherComments = commentsByStudent.get(comment.studentId)
      if (teacherComments) {
        teacherComments.teacherComments.push(comment)
      } else {
        commentsByStudent.set(
          comment.studentId,
          new TeacherCommentsByStudent(comment.studentId, [comment]),
        )
      }
    }
    logger.debug(
      `Room room_id: ${room.roomId} >> teacherCommentsByStudent >> ` +
        `students count: ${commentsByStudent.size}, ` +
        `total comments count: ${allTeacherComments.length}`,
    )

    return [...commentsByStudent.values()]
  }
}
