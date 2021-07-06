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
import { ParsedXapiEvent } from '../../../helpers/parsedXapiEvent'

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
  public answers = Promise.resolve<Answer[]>([])

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

  @Column({ type: 'int4', nullable: true })
  public min?: number | null
  @Column({ type: 'int4', nullable: true })
  public max?: number | null
  @Column({ type: 'int4', default: 0 })
  public sum = 0
  @Column({ type: 'int4', default: 0 })
  public scoreFrequency = 0
  @Column({ type: 'varchar', nullable: true })
  public contentType?: string | null
  @Column({ type: 'varchar', nullable: true })
  public contentName?: string | null

  public async applyEvent(xapiEvent: ParsedXapiEvent): Promise<void> {
    this.seen = true
    const score = xapiEvent.score?.raw
    const response = xapiEvent.response
    if (score === undefined && response === undefined) {
      return
    }
    await this.addAnswer(xapiEvent)
    this.updateMinMax(xapiEvent)
  }

  constructor(roomId: string, studentId: string, contentKey: string) {
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
  }

  public static new(
    roomOrId: Room | string,
    studentId: string,
    contentKey: string,
    contentType: string | undefined,
    contentName?: string,
  ): UserContentScore {
    const roomId = typeof roomOrId === 'string' ? roomOrId : roomOrId.roomId
    const userContentScore = new UserContentScore(roomId, studentId, contentKey)
    userContentScore.contentType = contentType
    userContentScore.contentName = contentName
    userContentScore.seen = false

    return userContentScore
  }

  protected async addAnswer(xapiEvent: ParsedXapiEvent): Promise<void> {
    const answers = await this.answers
    const answer = Answer.new(
      this,
      new Date(xapiEvent.timestamp),
      xapiEvent.response,
      // TODO: Maybe pass whole score object, instead.
      xapiEvent.score?.raw,
      xapiEvent.score?.min,
      xapiEvent.score?.max,
    )
    answers.push(answer)
    const score = xapiEvent.score?.raw
    if (score === undefined) {
      return
    }
    this.sum += score
    this.scoreFrequency += 1
  }

  protected updateMinMax(xapiEvent: ParsedXapiEvent): void {
    const min = xapiEvent?.score?.min
    if (min !== undefined) {
      this.min = min
    }
    const max = xapiEvent?.score?.max
    if (max !== undefined) {
      this.max = max
    }
  }
}
