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
import { withLogger } from 'kidsloop-nodejs-logger'
import { Logger } from 'winston'

import { Room } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { ContentScores, UserScores, TeacherCommentsByStudent } from '../graphql'
import { RoomScoresCalculator } from '../providers/roomScoresCalculator'
import { Context, UserID } from '../auth/context'

const logger = withLogger('room')

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      RoomResolver._logger ||
      (RoomResolver._logger = withLogger('RoomResolver'))
    )
  }

  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
  ) {}

  @Authorized()
  @Query(() => Room)
  public async Room(
    // TODO: This shouldn't be nullable.
    @Arg('room_id', { nullable: true }) roomId: string,
    @UserID() teacherId: string,
    @Ctx() context: Context,
  ): Promise<Room> {
    try {
      let room = await this.assessmentDB.findOne(Room, roomId, {})
      if (!room) {
        room = new Room(roomId)
      }

      const scores = await this.roomScoresCalculator.calculate(
        roomId,
        teacherId,
        context.encodedAuthenticationToken,
      )
      room.scores = Promise.resolve(scores)
      room.recalculate = scores.length == 0
      await this.assessmentDB.save(room)
      return room
    } catch (e) {
      this.Logger.error(e)
      throw e
    }
  }

  @FieldResolver(() => [UserScores])
  public async scoresByUser(@Root() room: Room): Promise<UserScores[]> {
    const scoresByUser: Map<string, UserScores> = new Map()

    for (const userContentScore of await room.scores) {
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

    return [...scoresByUser.values()]
  }

  @FieldResolver(() => [ContentScores])
  public async scoresByContent(@Root() room: Room): Promise<ContentScores[]> {
    const scoresByContent: Map<string, ContentScores> = new Map()

    for (const userContentScore of await room.scores) {
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

    return [...scoresByContent.values()]
  }

  @FieldResolver(() => [TeacherCommentsByStudent])
  public async teacherCommentsByStudent(
    @Root() room: Room,
  ): Promise<TeacherCommentsByStudent[]> {
    const commentsByStudent: Map<string, TeacherCommentsByStudent> = new Map()

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

    return [...commentsByStudent.values()]
  }
}
