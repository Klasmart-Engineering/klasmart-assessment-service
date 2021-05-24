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
import { Room } from './room'
import { ScoreSummary } from '../../../graphql/scoreSummary'
import { TeacherScore } from './teacherScore'

@Entity({ name: 'assessment_xapi_user_content_score' })
@ObjectType()
export class UserContentScore {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly room_id: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly student_id: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly content_id: string

  @ManyToOne(() => Room, (room) => room.scores, { lazy: true })
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public room!: Room

  @OneToMany(() => Answer, (answer) => answer.userContentScore, { lazy: true })
  public answers?: Promise<Answer[]> | Answer[]

  @Field(() => [TeacherScore])
  @OneToMany(
    () => TeacherScore,
    (teacherScore) => teacherScore.userContentScore,
    { lazy: true },
  )
  public teacherScores!: Promise<TeacherScore[]> | TeacherScore[]

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
  @Column({ default: 0 })
  public sum!: number
  @Column({ default: 0 })
  public scoreFrequency!: number

  public async addAnswer(answer: Answer): Promise<void> {
    let answers = await this.answers
    if (!answers) {
      this.answers = answers = []
    }
    answers.push(answer)

    const { score } = answer
    if (score === undefined) {
      return
    }

    if (this.min === undefined || score < this.min) {
      this.min = score
    }
    if (this.max === undefined || score > this.max) {
      this.max = score
    }
    this.sum += score
    this.scoreFrequency += 1
  }

  constructor(roomId: string, studentId: string, contentId: string) {
    this.room_id = roomId
    this.student_id = studentId
    this.content_id = contentId
  }

  public static new(
    roomOrId: Room | string,
    studentId: string,
    contentId: string,
    answers: Answer[] = [],
    teacherScores: TeacherScore[] = [],
    seen: boolean = answers.length > 0,
  ): UserContentScore {
    const roomId = typeof roomOrId === 'string' ? roomOrId : roomOrId.room_id
    const userContentScore = new UserContentScore(roomId, studentId, contentId)
    userContentScore.answers = []
    userContentScore.teacherScores = teacherScores
    userContentScore.seen = seen
    userContentScore.sum = 0
    userContentScore.scoreFrequency = 0
    for (const answer of answers) {
      userContentScore.addAnswer(answer)
    }

    return userContentScore
  }
}
