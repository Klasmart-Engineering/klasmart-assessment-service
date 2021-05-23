import { Mutation, Arg, Resolver } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Content } from '../db/assessments/entities/material'
import { TeacherScore } from '../db/assessments/entities/teacherScore'
import { User } from '../db/assessments/entities/user'
import { UserContentScore } from '../db/assessments/entities/userContentScore'
import { UserID } from './context'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  constructor(
    @InjectRepository(TeacherScore, 'assessments')
    private readonly repository: Repository<TeacherScore>,
  ) {}

  @Mutation((type) => TeacherScore)
  public async setScore(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('content_id') content_id: string,
    @Arg('score') score: number,
    @UserID() teacher_id?: string,
  ) {
    try {
      if (!teacher_id) { return }
      const teacher = User.random(teacher_id)
      const student = User.random(student_id)
      const content = Content.random(content_id)
      const userContentScore = UserContentScore.new(room_id, student, content)
      const teacherScore = TeacherScore.new(userContentScore, teacher, score)
      await this.repository.save(teacherScore)
      return teacherScore
    } catch(e) {
      console.error(e)
      throw new Error("Unable to save teacher score")
    }
  }
}
