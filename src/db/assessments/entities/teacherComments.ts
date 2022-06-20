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
import { BaseWithVersionCol } from './base'
import { User } from '../../../web'

@Entity({ name: 'assessment_xapi_teacher_comment' })
@ObjectType()
export class TeacherComment extends BaseWithVersionCol {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId: string

  @PrimaryColumn({ name: 'teacher_id', nullable: false })
  public readonly teacherId: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId: string

  // This explicit field for the foreign key should not be necessary.
  // But for some reason this column is null without it.
  @Column({ name: 'roomRoomId' })
  public readonly roomRoomId?: string

  @Field(() => User)
  public get teacher(): User {
    return { userId: this.teacherId }
  }

  @Field(() => User)
  public get student(): User {
    return { userId: this.studentId }
  }

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
  @CreateDateColumn({
    name: 'created_at',
  })
  public date!: Date

  @Field()
  @UpdateDateColumn({
    name: 'updated_at',
  })
  public lastUpdated!: Date

  @Column({ nullable: false })
  @Field()
  public comment!: string

  constructor(roomId: string, teacherId: string, studentId: string) {
    super()
    this.roomId = roomId
    this.roomRoomId = roomId
    this.teacherId = teacherId
    this.studentId = studentId
  }

  public static new(
    roomId: string,
    teacherId: string,
    studentId: string,
    comment: string,
  ): TeacherComment {
    const teacherComment = new TeacherComment(roomId, teacherId, studentId)
    teacherComment.comment = comment
    return teacherComment
  }
}
