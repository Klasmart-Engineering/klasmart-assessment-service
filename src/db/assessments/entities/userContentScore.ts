import { ObjectType, Field } from 'type-graphql'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm'
import { Answer } from './answer'
import { Content } from './material'
import { Room } from './room'
import { ScoreSummary } from './scoreSummary'
import { TeacherScore } from './teacherScore'
import { User } from './user'

@Entity({ name: 'user_content_score' })
@ObjectType()
export class UserContentScore {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly room_id: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly student_id: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly content_id: string

  @ManyToOne(() => Room, (room) => room.scores)
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public room!: Room

  @OneToMany(() => Answer, (answer) => answer.userContentScore)
  public answers?: Promise<Answer[]> | Answer[]

  @Field(() => [TeacherScore])
  @OneToMany(
    () => TeacherScore,
    (teacherScore) => teacherScore.userContentScore,
  )
  public teacherScores!: Promise<TeacherScore[]> | TeacherScore[]

  @Field()
  public user?: User //TODO: Federate
  @Field()
  public content?: Content //TODO: Federate

  @Field(() => Boolean)
  @Column()
  public seen!: boolean

  public async scores(): Promise<number[]> {
    const answers = await this.answers
    if (!answers) {
      return []
    }
    const scores = answers.map((x) => x.score)
    return scores.filter((x) => typeof x === 'number') as number[]
  }

  @Field(() => ScoreSummary)
  public async score(): Promise<ScoreSummary> {
    return new ScoreSummary(await this.answers)
  }

  @Column({ nullable: true })
  public min?: number
  @Column({ nullable: true })
  public max?: number
  @Column()
  public sum!: number
  @Column()
  public scoreFrequency!: number
  @Column({ nullable: true })
  public mean?: number

  private constructor(roomId: string, studentId: string, contentId: string) {
    this.room_id = roomId
    this.student_id = studentId
    this.content_id = contentId
  }

  public static mock(
    roomOrId: Room | string,
    student: User,
    content: Content,
    answers: Answer[] = [],
    teacherScores: TeacherScore[] = [],
    seen: boolean = answers.length > 0,
  ): UserContentScore {
    const roomId = typeof roomOrId === 'string' ? roomOrId : roomOrId.room_id
    const userContentScore = new UserContentScore(
      roomId,
      student.user_id,
      content.content_id,
    )
    userContentScore.answers = answers
    userContentScore.user = student
    userContentScore.content = content
    userContentScore.teacherScores = teacherScores
    userContentScore.seen = seen

    return userContentScore
  }
}
