import { ObjectType, Field, Arg, Mutation, Resolver } from 'type-graphql'
import { Column, Entity } from 'typeorm'
import { User } from './user'

@Entity({ name: 'teacher_comment' })
@ObjectType()
export class TeacherComment {
  //   @Field()
  //   public room: Room

  @Field()
  public student: User

  @Field()
  public teacher: User

  @Field()
  public date: Date

  @Column({ name: 'comment' })
  @Field()
  public comment: string

  constructor(
    teacher: User,
    student: User,
    comment: string,
    date = new Date(),
  ) {
    // this.room = room
    this.teacher = teacher
    this.student = student
    this.comment = comment
    this.date = date
  }
}
