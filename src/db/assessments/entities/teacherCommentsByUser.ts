import { ObjectType, Field, Arg, Mutation, Resolver } from 'type-graphql'
import { Service } from 'typedi'
import { randomUser } from '../../../random'
import { TeacherComment } from '../../../resolvers/teacherComments'
import { User } from './user'

@ObjectType()
export class TeacherCommentsByStudent {
  //   @Field()
  //   public room: Room

  @Field()
  public student: User

  @Field((type) => [TeacherComment])
  public teacherComments: TeacherComment[]

  constructor(student: User, comment: TeacherComment[]) {
    // this.room = room
    this.student = student
    this.teacherComments = comment
  }
}
