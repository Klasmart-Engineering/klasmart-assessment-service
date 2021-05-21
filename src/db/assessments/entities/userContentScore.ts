import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { randomArray, randomBool, randomInt, randomUser } from '../../../random'
import { Content } from './material'
import { ScoreSummary } from './scoreSummary'
import { TeacherScore } from './teacherScore'
import { User } from './user'

@Entity({ name: 'user_content_score' })
@ObjectType()
export class UserContentScore {
  @PrimaryColumn({ name: 'room_id' })
  public readonly roomId: string
  @PrimaryColumn({ name: 'student_id' })
  public readonly studentId: string
  @PrimaryColumn({ name: 'content_id' })
  public readonly contentId: string
  @Field()
  public readonly user: User
  @Field()
  public readonly content: Content
  @Field()
  public score: ScoreSummary
  @Column()
  @Field()
  public seen: boolean
  @Field(() => [TeacherScore])
  public teacherScores: TeacherScore[]

  @Column({ nullable: true })
  public min?: number
  @Column({ nullable: true })
  public max?: number
  @Column()
  public sum: number = 0
  @Column()
  public scoreFrequency: number = 0
  @Column({ nullable: true })
  public mean?: number

  constructor(user: User, content: Content, score = new ScoreSummary()) {
    this.user = user
    this.studentId = user.user_id
    this.content = content
    this.contentId = content.content_id
    this.score = score

    const { maximumPossibleScore, minimumPossibleScore } = content
    const range = maximumPossibleScore - minimumPossibleScore
    this.teacherScores = randomArray(
      randomInt(3, 0),
      () =>
        new TeacherScore(
          randomUser(),
          user,
          content,
          randomInt(range, minimumPossibleScore),
        ),
    )
    this.seen = randomBool(0.9)
  }
}
