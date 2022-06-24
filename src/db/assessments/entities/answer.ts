import { ObjectType, Field, Float } from 'type-graphql'
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { Base } from './base'
import { UserContentScore } from './userContentScore'

@Entity({ name: 'assessment_xapi_answer' })
@ObjectType()
export class Answer extends Base {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId!: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId!: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly contentKey!: string

  @PrimaryColumn({
    name: 'timestamp_epoch',
    type: 'bigint',
    default: 0,
    transformer: {
      to: (entityValue: number) => entityValue,
      from: (databaseValue: string): number => Number(databaseValue),
    },
  })
  public readonly timestamp!: number

  @Field(() => Date)
  public get date(): Date {
    return new Date(this.timestamp)
  }

  @ManyToOne(
    () => UserContentScore,
    (userContentScore) => userContentScore.answers,
    { lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  )
  public userContentScore!: Promise<UserContentScore>

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  public answer?: string | null

  @Column({ type: 'int4', nullable: true })
  @Field(() => Float, { nullable: true })
  public score?: number | null

  @Column({ name: 'minimum_possible_score', type: 'int4', nullable: true })
  @Field(() => Float, { nullable: true })
  public minimumPossibleScore?: number | null

  @Column({ name: 'maximum_possible_score', type: 'int4', nullable: true })
  @Field(() => Float, { nullable: true })
  public maximumPossibleScore?: number | null

  private constructor(
    roomId: string,
    studentId: string,
    contentKey: string,
    timestamp: number,
  ) {
    super()
    if (roomId == null) {
      // typeorm is making the call, so don't overwrite values.
      return
    }
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    this.timestamp = timestamp
  }

  public static new(
    userContentScore: UserContentScore,
    timestamp: number,
    answer?: string | null,
    score?: number | null,
    minimumPossibleScore?: number | null,
    maximumPossibleScore?: number | null,
  ): Answer {
    const answerObject = new Answer(
      userContentScore.roomId,
      userContentScore.studentId,
      userContentScore.contentKey,
      timestamp,
    )
    answerObject.userContentScore = Promise.resolve(userContentScore)
    answerObject.answer = answer
    answerObject.score = score
    answerObject.minimumPossibleScore = minimumPossibleScore
    answerObject.maximumPossibleScore = maximumPossibleScore
    return answerObject
  }
}
