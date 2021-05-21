import { ObjectType, Field, Arg, Mutation, Resolver } from 'type-graphql'
import { TeacherComment } from './teacherComments'
import { User } from './user'

@ObjectType()
export class TeacherCommentsByStudent {
  @Field()
  public student?: User //TODO: Federate

  @Field(() => [TeacherComment])
  public teacherComments: TeacherComment[]

  constructor(student?: User, comment: TeacherComment[] = []) {
    this.student = student
    this.teacherComments = comment
  }
}
