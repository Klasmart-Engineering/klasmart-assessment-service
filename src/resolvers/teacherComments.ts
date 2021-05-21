import { Arg, Mutation, Resolver } from 'type-graphql'
import { Service } from 'typedi'
import { randomUser } from '../random'
import { TeacherComment } from '../db/assessments/entities/teacherComments'

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  @Mutation((type) => TeacherComment)
  public async addComment(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
  ) {
    const teacher = randomUser()
    const student = randomUser()
    student.user_id = student_id
    return TeacherComment.mock(room_id, teacher, student, comment)
  }
}
