import { ObjectType, Field, Float, Int, Mutation, Arg, Resolver } from "type-graphql"
import { Service } from "typedi"
import { randomContent, randomUser, randomUsers } from "../random"
import { Content } from "./material"
import { Room } from "./room"
import { User } from "./user"

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

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  @Mutation(type => TeacherScore)
  public async setScore(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('content_id') content_id: string,
    @Arg('score') score: number,
  ) {
    const teacher = randomUser()
    const student = randomUser()
    student.user_id  = student_id
    const content = randomContent()
    content.content_id = content_id
    return new TeacherScore(
      teacher,
      student,
      content,
      score,
    )
  }
}