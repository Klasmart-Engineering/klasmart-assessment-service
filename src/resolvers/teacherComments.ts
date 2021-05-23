import { Arg, Mutation, Resolver } from 'type-graphql'
import { Service } from 'typedi'
import { TeacherComment } from '../db/assessments/entities/teacherComments'
import { UserID } from './context'
import { User } from '../db/assessments/entities/user'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  constructor(
    @InjectRepository(TeacherComment, 'assessments')
    private readonly repository: Repository<TeacherComment>,
  ) {}

  @Mutation((type) => TeacherComment, {nullable: true})
  public async addComment(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
    @UserID() teacher_id?: string,
  ) {
    if (!teacher_id) { return }
    try {
      const teacher = User.random(teacher_id)
      const student = User.random(student_id)
      const teacherComment = TeacherComment.new(
        room_id,
        teacher,
        student,
        comment,
        new Date(),
      )
      await this.repository.save(teacherComment)
      return teacherComment
    } catch(e) {
      console.error(e)
      throw new Error("Unable to save teacher comment")
    }
  }
}
