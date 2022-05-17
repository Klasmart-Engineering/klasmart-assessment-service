import {
  Arg,
  FieldResolver,
  Query,
  Resolver,
  Root,
  Authorized,
  Ctx,
} from 'type-graphql'
import { Inject, Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Room } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { ContentScores, UserScores, TeacherCommentsByStudent } from '../graphql'
import { RoomScoresCalculator } from '../providers/roomScoresCalculator'
import { Context, UserID } from '../auth/context'
import { RoomAttendanceProvider } from '../providers/roomAttendanceProvider'

const logger = withLogger('RoomResolver')

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
    @Inject('RoomAttendanceProvider')
    private readonly roomAttendanceProvider: RoomAttendanceProvider,
  ) {}

  @Authorized()
  @Query(() => Room)
  public async Room(
    // TODO: This shouldn't be nullable.
    @Arg('room_id', { nullable: true }) roomId: string,
    @UserID() teacherId: string,
    @Ctx() context: Context,
  ): Promise<Room> {
    logger.debug(`Room >> roomId: ${roomId}`)
    try {
      let room = await this.assessmentDB.findOne(Room, roomId, {})
      const attendances = await this.roomAttendanceProvider.getAttendances(
        roomId,
      )
      const attendanceCount = attendances.length
      if (room) {
        const cachedAttendanceCount = room.attendanceCount
        if (attendanceCount === cachedAttendanceCount) {
          return room
        }
      }
      if (!room) {
        room = new Room(roomId)
        logger.debug(`Room >> roomId: ${roomId} >> created new Room`)
      }
      if (attendanceCount === 0) {
        return room
      }
      const scores = await this.roomScoresCalculator.calculate(
        roomId,
        teacherId,
        attendances,
        context.encodedAuthenticationToken,
      )
      room.scores = Promise.resolve(scores)
      room.attendanceCount = attendanceCount
      await this.assessmentDB.save(room)
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
