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

  @PrimaryColumn({ name: 'teacher_id' })
  public readonly teacher_id: string

  @PrimaryColumn({ name: 'student_id' })
  public readonly student_id: string

  @ManyToOne(
    () => Room, // Linter bug
    (room) => room.teacherComments,
    { lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  )
  public readonly room!: Promise<Room>

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
