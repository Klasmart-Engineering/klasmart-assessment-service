import { ObjectType, Field } from 'type-graphql'
import { TeacherComment } from '../db/assessments/entities'
import { User } from '../web'

@ObjectType()
export class TeacherCommentsByStudent {
  public readonly studentId: string

  @Field(() => [TeacherComment])
  public teacherComments: TeacherComment[]

  @Field(() => User)
  public get student(): User {
    return { userId: this.studentId }
  }

  constructor(studentId: string, comment: TeacherComment[]) {
    this.studentId = studentId
    this.teacherComments = comment
  }
}
