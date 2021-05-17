import { ObjectType, Field, Float, Int } from "type-graphql"
import { Content } from "./material"
import { User } from "./user"

@ObjectType()
export class TeacherScore {
  @Field()
  public teacher: User

  @Field()
  public student: User

  @Field()
  public content: Content

  @Field()
  public score: number

  @Field()
  public date: Date

  constructor(teacher: User, student: User, content: Content, score: number) {
    this.teacher = teacher
    this.student = student
    this.content = content
    this.score = score
    this.date = new Date()
  }
}
