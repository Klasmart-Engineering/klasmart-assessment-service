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

import { Context, UserID } from '../auth/context'
import { TeacherComment } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { ErrorMessage } from '../helpers/errorMessages'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('TeacherCommentResolver')

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
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
    logger.debug(
      `Mutation >> setComment >> roomId: ${roomId}, ` +
        `studentId: ${studentId}, comment: ${comment.substr(0, 20)}...`,
    )
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
    logger.debug(
      `Mutation >> addComment >> roomId: ${roomId}, ` +
        `studentId: ${studentId}, comment: ${comment.substr(0, 20)}...`,
    )
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
      logger.error(e)
      throw e
    }
  }

  @FieldResolver(() => User, { nullable: true })
  public teacher(@Root() source: TeacherComment): User {
    logger.debug(`TeacherScore { teacherId: ${source.teacherId} } >> teacher`)
    return { userId: source.teacherId }
  }

  @FieldResolver(() => User, { nullable: true })
  public student(@Root() source: TeacherComment): User {
    logger.debug(`TeacherScore { studentId: ${source.studentId} } >> student`)
    return { userId: source.studentId }
  }
}
