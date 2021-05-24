import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { Room } from './room'

@Entity({ name: 'assessment_xapi_teacher_comment' })
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
    teacherId: string,
    studentId: string,
    comment: string,
    date = new Date(),
  ): TeacherComment {
    const teacherComment = new TeacherComment(roomId, teacherId, studentId)
    teacherComment.date = date
    teacherComment.comment = comment
    return teacherComment
  }
}
