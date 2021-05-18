import { ObjectType, Field, Arg, Mutation, Resolver } from "type-graphql"
import { Service } from "typedi"
import { randomUser } from "../random"
import { User } from "./user"

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

  @Field()
  public comment: string

  constructor(teacher: User, student: User, comment: string, date = new Date()) {
    // this.room = room  
    this.teacher = teacher
    this.student = student
    this.comment = comment
    this.date = date
  }
}

@Service()
@Resolver(() => TeacherComment)
export default class TeacherCommentResolver {
  @Mutation(type => TeacherComment)
  public async addComment(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('comment') comment: string,
  ) {
    const teacher = randomUser()
    const student = randomUser()
    student.user_id  = student_id
    return new TeacherComment(
      teacher,
      student,
      comment,
    )
  }
}