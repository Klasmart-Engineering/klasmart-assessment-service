import { ObjectType, Field } from 'type-graphql'
import { TeacherComment } from '../db/assessments/entities'

@ObjectType()
export class TeacherCommentsByStudent {
  public readonly student_id: string

  @Field(() => [TeacherComment])
  public teacherComments: TeacherComment[]

  constructor(student_id: string, comment: TeacherComment[] = []) {
    this.student_id = student_id
    this.teacherComments = comment
  }
}
