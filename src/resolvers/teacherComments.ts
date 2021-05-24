import { Arg, FieldResolver, Mutation, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { TeacherComment } from '../db/assessments/entities/teacherComments'
import { UserID } from './context'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'
import { User } from '../db/users/entities'

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  constructor(
    @InjectRepository(TeacherComment, 'assessments')
    private readonly repository: Repository<TeacherComment>,
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
  ) {}

  @Mutation((type) => TeacherComment, { nullable: true })
  public async addComment(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
    @UserID() teacher_id?: string,
  ) {
    if (!teacher_id) {
      return
    }
    try {
      const teacherComment = TeacherComment.new(
        room_id,
        teacher_id,
        student_id,
        comment,
        new Date(),
      )
      await this.repository.save(teacherComment)
      return teacherComment
    } catch (e) {
      console.error(e)
      throw new Error('Unable to save teacher comment')
    }
  }

  @FieldResolver(() => User, { nullable: true })
  public async teacher(@Root() source: TeacherComment) {
    return await this.userRepository.findOne({
      where: { user_id: source.teacherId },
    })
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(@Root() source: TeacherComment) {
    return await this.userRepository.findOne({
      where: { user_id: source.studentId },
    })
  }
}
