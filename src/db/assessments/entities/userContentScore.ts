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
  public readonly roomId: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly contentKey: string

  @ManyToOne(
    () => Room, //Linter bug
    (room) => room.scores,
    { lazy: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  )
  public room!: Promise<Room>

  @OneToMany(
    () => Answer, //Useless comment due to linter bug
    (answer) => answer.userContentScore,
    { lazy: true, cascade: false },
  )
  @JoinColumn([
    { name: 'room_id', referencedColumnName: 'room_id' },
    { name: 'student_id', referencedColumnName: 'student_id' },
    { name: 'content_id', referencedColumnName: 'content_id' },
  ])
  public answers?: Promise<Answer[]>

  @Field(() => [TeacherScore])
  @OneToMany(
    () => TeacherScore,
    (teacherScore) => teacherScore.userContentScore,
    { lazy: true },
  )
  @JoinColumn([
    { name: 'room_id', referencedColumnName: 'room_id' },
    { name: 'student_id', referencedColumnName: 'student_id' },
    { name: 'content_id', referencedColumnName: 'content_id' },
  ])
  public teacherScores!: Promise<TeacherScore[]>

  @Field(() => Boolean)
  @Column({ type: 'bool', default: false })
  public seen!: boolean

  private resetMultipleHotspots = false

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
  @Column({ nullable: true })
  public contentType?: string
  @Column({ nullable: true })
  public contentName?: string

  public async addAnswer(answer: Answer): Promise<void> {
    let answers = await this.answers
    if (!answers) {
      answers = []
      this.answers = Promise.resolve(answers)
    }

    if (this.contentType === 'ImageMultipleHotspotQuestion') {
      if (this.resetMultipleHotspots || answers.length <= 0) {
        this.resetMultipleHotspots = false
        answers.push(answer)
      }
      answers[answers.length - 1].score = answer.score
    } else {
      answers.push(answer)
    }

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

  public startMultipleHotspots(): void {
    this.resetMultipleHotspots = true
  }

  constructor(roomId: string, studentId: string, contentKey: string) {
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    this.seen = false
  }

  public static new(
    roomOrId: Room | string,
    studentId: string,
    contentKey: string,
    contentType: string | undefined,
    contentName?: string,
    answers: Answer[] = [],
    seen: boolean = answers.length > 0,
  ): UserContentScore {
    const roomId = typeof roomOrId === 'string' ? roomOrId : roomOrId.roomId
    const userContentScore = new UserContentScore(roomId, studentId, contentKey)
    userContentScore.contentType = contentType
    userContentScore.contentName = contentName
    userContentScore.answers = Promise.resolve([])
    userContentScore.seen = seen
    userContentScore.sum = 0
    userContentScore.scoreFrequency = 0
    for (const answer of answers) {
      userContentScore.addAnswer(answer)
    }

    return userContentScore
  }
}
