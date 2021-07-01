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

@Entity({ name: 'assessment_xapi_teacher_score' })
@ObjectType()
export class TeacherScore {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly fullContentId: string

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
  @CreateDateColumn()
  public date!: Date

  @Field()
  @UpdateDateColumn()
  public lastUpdated!: Date

  @Field()
  @Column('float4', { nullable: false, default: 0.0 })
  public score!: number

  constructor(
    roomId: string,
    teacherId: string,
    studentId: string,
    contentId: string,
  ) {
    this.roomId = roomId
    this.teacherId = teacherId
    this.studentId = studentId
    this.fullContentId = contentId
  }

  public static new(
    userContentScore: UserContentScore,
    teacherId: string,
    score: number,
    date = new Date(),
  ): TeacherScore {
    const teacherScore = new TeacherScore(
      userContentScore.roomId,
      teacherId,
      userContentScore.studentId,
      userContentScore.contentId,
    )
    teacherScore.userContentScore = Promise.resolve(userContentScore)
    teacherScore.score = score
    teacherScore.date = date

    return teacherScore
  }
}
