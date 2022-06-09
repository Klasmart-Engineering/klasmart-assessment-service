import { v4 } from 'uuid'
import { Field, ObjectType } from 'type-graphql'
import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm'
import { TeacherComment } from './teacherComments'
import { UserContentScore } from './userContentScore'
import { Base } from './base'

@Entity({ name: 'assessment_xapi_room' })
@ObjectType()
export class Room extends Base {
  @PrimaryColumn({ name: 'room_id' })
  @Field({ name: 'room_id' })
  public readonly roomId: string

  @Field(() => [UserContentScore])
  @OneToMany(
    () => UserContentScore,
    (userContentScore) => userContentScore.room,
    { lazy: true, cascade: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public scores!: Promise<ReadonlyArray<UserContentScore>>

  @Field(() => [TeacherComment])
  @OneToMany(
    () => TeacherComment,
    (userContentScore) => userContentScore.room,
    { lazy: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public teacherComments!: Promise<ReadonlyArray<TeacherComment>>

  @Column({ type: 'timestamp', nullable: true })
  public startTime?: Date | null

  @Column({ type: 'timestamp', nullable: true })
  public endTime?: Date | null

  @Column({ type: 'smallint', name: 'attendance_count', nullable: true })
  public attendanceCount?: number | null

  @Column({ default: false })
  public recalculate!: boolean

  constructor(roomId = v4(), startTime?: Date, endTime?: Date) {
    super()
    this.roomId = roomId
    this.startTime = startTime
    this.endTime = endTime
  }
}
