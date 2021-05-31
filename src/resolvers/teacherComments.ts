import { Arg, FieldResolver, Mutation, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { TeacherComment } from '../db/assessments/entities/teacherComments'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'
import { EntityManager, Repository } from 'typeorm'
import { User } from '../db/users/entities'
import { UserID } from './context'

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  constructor(
    @InjectManager('assessments')
    private readonly assesmentDB: EntityManager,
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
  ) {}

  @Mutation(() => TeacherComment, { nullable: true })
  public async setComment(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
  ) {
    return await this.addComment(room_id, student_id, comment)
  }

  @Mutation(() => TeacherComment, {
    nullable: true,
    deprecationReason: 'Use setComment(room_id, student_id, comment) resolver',
  })
  public async addComment(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
    @UserID() teacher_id?: string,
  ): Promise<TeacherComment | undefined> {
    try {
      if (!teacher_id) {
        throw new Error('Please authenticate')
      }

      let teacherComment = await this.assesmentDB.findOne(TeacherComment, {
        room_id,
        student_id,
        teacher_id,
      })

      let update = true
      if (!teacherComment) {
        update = false
        teacherComment = TeacherComment.new(
          room_id,
          student_id,
          teacher_id,
          comment,
        )
      }

      //TODO: Investigate upsert
      if (update) {
        await this.assesmentDB.save(TeacherComment, teacherComment)
      } else {
        await this.assesmentDB.insert(TeacherComment, teacherComment)
      }
      return teacherComment
    } catch (e) {
      console.error(e)
      throw e
    }
    throw new Error('Unable to save teacher comment')
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
