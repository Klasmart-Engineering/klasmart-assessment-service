import { ObjectType, Field } from 'type-graphql'
import { Content } from './material'
import { User } from './user'

@ObjectType()
export class TeacherScore {
  // @Field()
  // public room: Room

  @Field()
  public teacher: User

  @Field()
  public student: User

  @Field()
  public content: Content

  @Field()
  public date: Date

  @Field()
  public score: number

  constructor(teacher: User, student: User, content: Content, score: number) {
    // this.room = room
    this.teacher = teacher
    this.student = student
    this.content = content
    this.score = score
    this.date = new Date()
  }
}
