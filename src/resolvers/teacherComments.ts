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
import { EntityManager, Repository } from 'typeorm'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'

import { TeacherComment } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'
import { User } from '../db/users/entities'
import { Context, UserID } from '../auth/context'

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assesmentDB: EntityManager,
    @InjectRepository(User, USERS_CONNECTION_NAME)
    private readonly userRepository: Repository<User>,
  ) {}

  @Authorized()
  @Mutation(() => TeacherComment, { nullable: true })
  public async setComment(
    @Ctx() context: Context,
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
    @UserID() teacher_id: string,
  ): Promise<TeacherComment | undefined> {
    return await this.addComment(
      context,
      room_id,
      student_id,
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
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
    @UserID() teacher_id: string,
  ): Promise<TeacherComment | undefined> {
    try {
      const teacherComment =
        (await this.assesmentDB.findOne(TeacherComment, {
          room_id,
          student_id,
          teacher_id,
        })) || TeacherComment.new(room_id, teacher_id, student_id, comment)

      teacherComment.comment = comment
      await this.assesmentDB.save(TeacherComment, teacherComment)

      return teacherComment
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  @FieldResolver(() => User, { nullable: true })
  public async teacher(
    @Root() source: TeacherComment,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { user_id: source.teacher_id },
    })
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherComment,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { user_id: source.student_id },
    })
  }
}
