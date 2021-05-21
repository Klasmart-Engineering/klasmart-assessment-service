import { ObjectType, Field } from 'type-graphql'
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { Content } from './material'
import { User } from './user'

@Entity({ name: 'answer' })
@ObjectType()
export class Answer {
  @PrimaryColumn({ name: 'room_id' })
  public readonly roomId: string

  @PrimaryColumn({ name: 'student_id' })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id' })
  public readonly contentId: string

  @PrimaryColumn({ name: 'timestamp' })
  public readonly timestamp: number

  @Field(() => User)
  public student: User

  @Field(() => User)
  public content: Content

  @Column()
  @Field({ nullable: true })
  public answer?: string

  @Column()
  @Field({ nullable: true })
  public score?: number

  @Field(() => Date)
  public date = new Date()

  @Column({ name: 'minimum_possible_score' })
  @Field()
  public minimumPossibleScore?: number
  @Column({ name: 'maximum_possible_score' })
  @Field()
  public maximumPossibleScore?: number

  constructor(
    roomId: string,
    studentId: string,
    contentId: string,
    answer?: string,
    score?: number,
    minimumPossibleScore?: number,
    maximumPossibleScore?: number,
  ) {
    this.roomId = roomId
    this.studentId = studentId
    this.contentId = contentId
    this.answer = answer
    this.score = score
    this.minimumPossibleScore = minimumPossibleScore
    this.maximumPossibleScore = maximumPossibleScore
  }
}
