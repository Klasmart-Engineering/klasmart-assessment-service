import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { Content } from './material'
import { User } from './user'

@Entity({ name: 'teacher_score' })
@ObjectType()
export class TeacherScore {
  @PrimaryColumn({ name: 'room_id' })
  public readonly roomId: string

  @PrimaryColumn({ name: 'teacher_id' })
  public readonly teacherId: string

  @PrimaryColumn({ name: 'student_id' })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id' })
  public readonly contentId: string

  @Field()
  public teacher: User

  @Field()
  public student: User

  @Field()
  public content: Content

  @Column()
  @Field()
  public date: Date

  @Column()
  @Field()
  public score: number

  constructor(teacher: User, student: User, content: Content, score: number) {
    // this.room = room
    this.teacher = teacher
    this.teacherId = teacher.user_id
    this.student = student
    this.studentId = student.user_id
    this.content = content
    this.contentId = content.content_id
    this.score = score
    this.date = new Date()
  }
}
