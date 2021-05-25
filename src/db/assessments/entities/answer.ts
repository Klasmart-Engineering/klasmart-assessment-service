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

  @Column()
  @Field({ nullable: true })
  public answer?: string

  @Column()
  @Field({ nullable: true })
  public score?: number

  @Column({ name: 'minimum_possible_score' })
  @Field()
  public minimumPossibleScore?: number
  @Column({ name: 'maximum_possible_score' })
  @Field()
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
    const x = new Answer(
      userContentScore.room_id,
      userContentScore.student_id,
      userContentScore.content_id,
      date,
    )
    x.userContentScore = userContentScore
    x.answer = answer
    x.score = score
    x.minimumPossibleScore = minimumPossibleScore
    x.maximumPossibleScore = maximumPossibleScore
    return x
  }
}
