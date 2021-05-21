import { ObjectType, Field, Arg, Mutation, Resolver } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { User } from './user'

@Entity({ name: 'teacher_comment' })
@ObjectType()
export class TeacherComment {
  @PrimaryColumn({ name: 'room_id' })
  public readonly roomId: string

  @PrimaryColumn({ name: 'teacher_id' })
  public readonly teacherId: string

  @PrimaryColumn({ name: 'student_id' })
  public readonly studentId: string

  @Field()
  public student: User

  @Field()
  public teacher: User

  @Column()
  @Field()
  public date: Date

  @Column()
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
    this.teacherId = teacher.user_id
    this.student = student
    this.studentId = student.user_id
    this.comment = comment
    this.date = date
  }
}
