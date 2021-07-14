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
import { ScoreSummary } from '../../../graphql'
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
  @Column({ type: 'bool', default: false })
  public seen: boolean

  @Field(() => ScoreSummary, { name: 'score' })
  public async scoreSummary(): Promise<ScoreSummary> {
    return new ScoreSummary(await this.answers)
  }

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
  }

  constructor(roomId: string, studentId: string, contentKey: string) {
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    this.seen = false
  }

  public static new(
    roomId: string,
    studentId: string,
    contentKey: string,
    contentType: string | undefined,
    contentName?: string,
  ): UserContentScore {
    const userContentScore = new UserContentScore(roomId, studentId, contentKey)
    userContentScore.contentType = contentType
    userContentScore.contentName = contentName

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
  }
}
