import { ObjectType, Field } from 'type-graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Room } from './room'

@Entity({ name: 'assessment_xapi_teacher_comment' })
@ObjectType()
export class TeacherComment {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly room_id: string

  @PrimaryColumn({ name: 'teacher_id', nullable: false })
  public readonly teacher_id: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly student_id: string

  // This explicit field for the foreign should not be necessary.
  // But for some reason this column is null without it.
  @Column({ name: 'roomRoomId' })
  public readonly roomRoomId?: string

  @ManyToOne(
    () => Room, // Linter bug
    (room) => room.teacherComments,
    {
      lazy: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  public room!: Promise<Room>

  @Field()
  @CreateDateColumn()
  public date!: Date

  @Field()
  @UpdateDateColumn()
  public lastUpdated!: Date

  @Column({ nullable: false })
  @Field()
  public comment!: string

  constructor(roomId: string, teacherId: string, studentId: string) {
    this.room_id = roomId
    this.roomRoomId = roomId
    this.teacher_id = teacherId
    this.student_id = studentId
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
