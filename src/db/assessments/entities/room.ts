import { Field, ObjectType } from 'type-graphql'
import { v4 } from 'uuid'
import { TeacherComment } from './teacherComments'
import { UserContentScore } from './userContentScore'
import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm'

@Entity({ name: 'assessment_xapi_room' })
@ObjectType()
export class Room {
  @PrimaryColumn({ name: 'room_id' })
  @Field()
  public readonly room_id: string

  @Field(() => [UserContentScore])
  @OneToMany(
    () => UserContentScore,
    (userContentScore) => userContentScore.room,
    { lazy: true, cascade: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public scores!: Promise<UserContentScore[]>

  @Field(() => [TeacherComment])
  @OneToMany(
    () => TeacherComment,
    (userContentScore) => userContentScore.room,
    { lazy: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public teacherComments!: Promise<TeacherComment[]>

  @Column({ nullable: true })
  public startTime?: Date

  @Column({ nullable: true })
  public endTime?: Date

  @Column({ default: false })
  public recalculate!: boolean

  constructor(room_id = v4(), startTime?: Date, endTime?: Date) {
    this.room_id = room_id
    this.startTime = startTime
    this.endTime = endTime
  }
}
