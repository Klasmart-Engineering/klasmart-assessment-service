import { ObjectType, Field } from 'type-graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserContentScore } from './userContentScore'
import { BaseWithVersionCol } from './base'
import { User } from '../../../web'

@Entity({ name: 'assessment_xapi_teacher_score' })
@ObjectType()
export class TeacherScore extends BaseWithVersionCol {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly contentKey: string

  @PrimaryColumn({ name: 'teacher_id', nullable: false })
  public readonly teacherId: string

  @ManyToOne(
    () => UserContentScore,
    (userContentScore) => userContentScore.teacherScores,
    {
      lazy: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  public userContentScore?: Promise<UserContentScore>

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

  @Field()
  @Column('float4', { nullable: false, default: 0.0 })
  public score!: number

  @Field(() => User)
  public get teacher(): User {
    return { userId: this.teacherId }
  }

  @Field(() => User)
  public get student(): User {
    return { userId: this.studentId }
  }

  constructor(
    roomId: string,
    teacherId: string,
    studentId: string,
    contentKey: string,
  ) {
    super()
    this.roomId = roomId
    this.teacherId = teacherId
    this.studentId = studentId
    this.contentKey = contentKey
  }

  public static new(
    userContentScore: UserContentScore,
    teacherId: string,
    score: number,
  ): TeacherScore {
    const teacherScore = new TeacherScore(
      userContentScore.roomId,
      teacherId,
      userContentScore.studentId,
      userContentScore.contentKey,
    )
    teacherScore.userContentScore = Promise.resolve(userContentScore)
    teacherScore.score = score

    return teacherScore
  }
}
