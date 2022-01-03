import { ObjectType, Field } from 'type-graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm'
import { Room } from './room'
import { featureFlags } from '../../../initialization/featureFlags'
import { BaseWithVersionCol } from './base'

const Base = featureFlags.UseCreatedAtUpdatedAtVersionColumns
  ? BaseWithVersionCol
  : BaseEntity

@Entity({ name: 'assessment_xapi_teacher_comment' })
@ObjectType()
export class TeacherComment extends Base {
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
    name: featureFlags.UseCreatedAtUpdatedAtVersionColumns
      ? 'created_at'
      : 'date',
  })
  public date!: Date

  @Field()
  @UpdateDateColumn({
    name: featureFlags.UseCreatedAtUpdatedAtVersionColumns
      ? 'updated_at'
      : 'lastUpdated',
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
