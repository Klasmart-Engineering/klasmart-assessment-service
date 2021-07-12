import { ObjectType, Field } from 'type-graphql'
import { TeacherComment } from '../db/assessments/entities'

@ObjectType()
export class TeacherCommentsByStudent {
  public readonly studentId: string

  @Field(() => [TeacherComment])
  public teacherComments: TeacherComment[]

  constructor(studentId: string, comment: TeacherComment[]) {
    this.studentId = studentId
    this.teacherComments = comment
  }
}
