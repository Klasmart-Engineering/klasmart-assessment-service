import {
  Arg,
  FieldResolver,
  Query,
  Resolver,
  Root,
  Authorized,
} from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'

import { Room } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'
import { ContentScores, UserScores, TeacherCommentsByStudent } from '../graphql'
import { RoomScoresCalculator } from '../helpers/roomScoresCalculator'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { ILogger, Logger } from '../helpers/logger'
import { UserID } from '../auth/context'

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  private static _logger: ILogger
  private get Logger(): ILogger {
    return (
      RoomResolver._logger ||
      (RoomResolver._logger = Logger.get('RoomResolver'))
    )
  }

  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    @InjectManager(USERS_CONNECTION_NAME)
    private readonly userDB: EntityManager,
    @InjectManager(CMS_CONNECTION_NAME)
    private readonly cmsDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
  ) {}

  @Authorized()
  @Query(() => Room)
  public async Room(
    // TODO: This shouldn't be nullable.
    @Arg('room_id', { nullable: true }) roomId: string,
    @UserID() teacherId: string,
  ): Promise<Room> {
    try {
      let room = await this.assessmentDB.findOne(Room, roomId, {})
      if (!room) {
        room = new Room(roomId)
      }

      const scores = await this.roomScoresCalculator.calculate(
        roomId,
        teacherId,
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
      const contentScores = scoresByContent.get(userContentScore.studentId)
      if (contentScores) {
        contentScores.scores.push(userContentScore)
      } else {
        scoresByContent.set(
          userContentScore.studentId,
          new ContentScores(
            userContentScore.contentKey,
            [userContentScore],
            userContentScore.contentType,
            userContentScore.contentName,
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
