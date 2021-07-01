import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { UserContentScore } from './userContentScore'

@Entity({ name: 'assessment_xapi_answer' })
@ObjectType()
export class Answer {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly fullContentId: string

  @PrimaryColumn({ name: 'timestamp' })
  @Field(() => Date)
  public readonly date: Date

  @ManyToOne(
    () => UserContentScore,
    (userContentScore) => userContentScore.answers,
    { lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  )
  public userContentScore!: Promise<UserContentScore>

  @Column({ nullable: true })
  @Field({ nullable: true })
  public answer?: string

  @Column({ nullable: true })
  @Field({ nullable: true })
  public score?: number

  @Column({ name: 'minimum_possible_score', nullable: true })
  @Field({ nullable: true })
  public minimumPossibleScore?: number

  @Column({ name: 'maximum_possible_score', nullable: true })
  @Field({ nullable: true })
  public maximumPossibleScore?: number

  constructor(
    roomId: string,
    studentId: string,
    contentId: string,
    date: Date,
  ) {
    this.roomId = roomId
    this.studentId = studentId
    this.fullContentId = contentId
    this.date = date
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
      userContentScore.contentId,
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
