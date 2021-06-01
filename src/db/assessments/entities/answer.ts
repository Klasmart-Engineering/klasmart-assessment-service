import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { UserContentScore } from './userContentScore'

@Entity({ name: 'assessment_xapi_answer' })
@ObjectType()
export class Answer {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly room_id: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly student_id: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly content_id: string

  @PrimaryColumn({ name: 'timestamp' })
  @Field(() => Date)
  public date!: Date

  @ManyToOne(
    () => UserContentScore,
    (userContentScore) => userContentScore.answers,
    { lazy: true },
  )
  @JoinColumn([
    { name: 'room_id', referencedColumnName: 'room_id' },
    { name: 'student_id', referencedColumnName: 'student_id' },
    { name: 'content_id', referencedColumnName: 'content_id' },
  ])
  public userContentScore!: Promise<UserContentScore> | UserContentScore

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
    room_id: string,
    student_id: string,
    content_id: string,
    date: Date,
  ) {
    this.room_id = room_id
    this.student_id = student_id
    this.content_id = content_id
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
      userContentScore.room_id,
      userContentScore.student_id,
      userContentScore.content_id,
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
