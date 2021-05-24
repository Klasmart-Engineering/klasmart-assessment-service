import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { pick } from '../../../random'
import { Room } from './room'
import { User } from './user'

@Entity({ name: 'teacher_comment' })
@ObjectType()
export class TeacherComment {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId: string

  @PrimaryColumn({ name: 'teacher_id' })
  public readonly teacherId: string

  @PrimaryColumn({ name: 'student_id' })
  public readonly studentId: string

  @ManyToOne(() => Room, (room) => room.teacherComments, { lazy: true })
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public readonly room!: Promise<Room> | Room

  @Field()
  public teacher?: User //TODO: Federate
  @Field()
  public student?: User //TODO: Federate

  @Column({ nullable: false })
  @Field()
  public date!: Date

  @Column({ nullable: false })
  @Field()
  public comment!: string

  constructor(roomId: string, teacherId: string, studentId: string) {
    this.roomId = roomId
    this.teacherId = teacherId
    this.studentId = studentId
  }

  public static new(
    roomId: string,
    teacher: User,
    student: User,
    comment: string,
    date = new Date(),
  ): TeacherComment {
    const teacherComment = new TeacherComment(
      roomId,
      teacher.user_id,
      student.user_id,
    )
    teacherComment.teacher = teacher
    teacherComment.student = student
    teacherComment.date = date
    teacherComment.comment = comment
    return teacherComment
  }
}
