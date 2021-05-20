import { Mutation, Arg, Resolver } from 'type-graphql'
import { Service } from 'typedi'
import { TeacherScore } from '../db/assessments/entities/teacherScore'
import { randomContent, randomUser } from '../random'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  @Mutation((type) => TeacherScore)
  public async setScore(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('content_id') content_id: string,
    @Arg('score') score: number,
  ) {
    const teacher = randomUser()
    const student = randomUser()
    student.user_id = student_id
    const content = randomContent()
    content.content_id = content_id
    return new TeacherScore(teacher, student, content, score)
  }
}
