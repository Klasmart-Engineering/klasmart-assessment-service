import { ObjectType, Field, Float } from 'type-graphql'
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { Base } from './base'
import { UserContentScore } from './userContentScore'

@Entity({ name: 'assessment_xapi_answer' })
@ObjectType()
export class Answer extends Base {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly contentKey: string

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
    date: Date,
  ) {
    super()
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    // This null check is needed because TypeOrm calls constructors
    // with null parameters when loading entities.
    this.timestamp = this.timestamp = date?.getTime() ?? 0
  }

  public static new(
    userContentScore: UserContentScore,
    date: Date,
    answer?: string,
    score?: number,
    minimumPossibleScore?: number,
    maximumPossibleScore?: number,
  ): Answer {
    const answerObject = new Answer(
      userContentScore.roomId,
      userContentScore.studentId,
      userContentScore.contentKey,
      date,
    )
    answerObject.userContentScore = Promise.resolve(userContentScore)
    answerObject.answer = answer
    answerObject.score = score
    answerObject.minimumPossibleScore = minimumPossibleScore
    answerObject.maximumPossibleScore = maximumPossibleScore
    return answerObject
  }
}
