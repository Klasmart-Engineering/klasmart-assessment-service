import {
  Arg,
  FieldResolver,
  Mutation,
  Resolver,
  Root,
  Ctx,
  Authorized,
} from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { UserInputError } from 'apollo-server-express'
import { InjectManager } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Logger } from 'winston'

import { Context, UserID } from '../auth/context'
import { TeacherComment } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { ErrorMessage } from '../helpers/errorMessages'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      TeacherCommentResolver._logger ||
      (TeacherCommentResolver._logger = withLogger('TeacherCommentResolver'))
    )
  }

  constructor(
    private readonly userProvider: UserProvider,
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    private readonly scheduleProvider: CmsScheduleProvider,
  ) {}

  @Authorized()
  @Mutation(() => TeacherComment, { nullable: true })
  public async setComment(
    @Ctx() context: Context,
    @Arg('room_id') roomId: string,
    @Arg('student_id') studentId: string,
    @Arg('comment') comment: string,
    @UserID() teacher_id: string,
  ): Promise<TeacherComment | undefined> {
    return await this.addComment(
      context,
      roomId,
      studentId,
      comment,
      teacher_id,
    )
  }

  @Authorized()
  @Mutation(() => TeacherComment, {
    nullable: true,
    deprecationReason: 'Use setComment(room_id, student_id, comment) resolver',
  })
  public async addComment(
    @Ctx() context: Context,
    @Arg('room_id') roomId: string,
    @Arg('student_id') studentId: string,
    @Arg('comment') comment: string,
    @UserID() teacherId: string,
  ): Promise<TeacherComment | undefined> {
    try {
      const schedule = await this.scheduleProvider.getSchedule(
        roomId,
        context.encodedAuthenticationToken,
      )
      if (!schedule) {
        throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
      }

      const student = await this.userProvider.getUser(
        studentId,
        context.encodedAuthenticationToken,
      )
      if (!student) {
        throw new UserInputError(ErrorMessage.unknownUser(studentId))
      }

      const teacherComment =
        (await this.assessmentDB.findOne(TeacherComment, {
          roomId: roomId,
          studentId: studentId,
          teacherId: teacherId,
        })) || TeacherComment.new(roomId, teacherId, studentId, comment)

      teacherComment.comment = comment
      await this.assessmentDB.save(TeacherComment, teacherComment)

      return teacherComment
    } catch (e) {
      this.Logger.error(e)
      throw e
    }
  }

  @FieldResolver(() => User, { nullable: true })
  public async teacher(
    @Root() source: TeacherComment,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.teacherId,
      context.encodedAuthenticationToken,
    )
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherComment,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }
}
