import { ObjectType, Field } from 'type-graphql'
import { TypeormLoader } from 'type-graphql-dataloader'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm'
import { Answer } from './answer'
import { Base } from './base'
import { Room } from './room'
import { ScoreSummary } from '../../../graphql'
import { TeacherScore } from './teacherScore'
import { ParsedXapiEvent } from '../../../helpers/parsedXapiEvent'

@Entity({ name: 'assessment_xapi_user_content_score' })
@ObjectType()
export class UserContentScore extends Base {
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
    { lazy: true, cascade: true },
  )
  @JoinColumn([
    { name: 'room_id', referencedColumnName: 'room_id' },
    { name: 'student_id', referencedColumnName: 'student_id' },
    { name: 'content_id', referencedColumnName: 'content_id' },
  ])
  @TypeormLoader()
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
  @TypeormLoader()
  public teacherScores!: Promise<ReadonlyArray<TeacherScore>>

  @Field(() => Boolean)
  @Column({ type: 'bool', default: false })
  public seen: boolean

  @Field(() => ScoreSummary, { name: 'score' })
  public async scoreSummary(): Promise<ScoreSummary> {
    return new ScoreSummary((await this.answers) ?? [])
  }

  @Column({ type: 'varchar', nullable: true })
  public contentType?: string | null

  @Column({ type: 'varchar', nullable: true })
  public contentName?: string | null

  @Column({ type: 'varchar', nullable: true })
  public contentParentId?: string | null

  public async applyEvent(xapiEvent: ParsedXapiEvent): Promise<void> {
    this.seen = true
    const score = xapiEvent.score?.raw
    const response = xapiEvent.response
    if (score === undefined && response === undefined) {
      console.warn('applyEvent > xapiEvent does not have a response or score')
      return
    }
    await this.addAnswer(xapiEvent)
  }

  public async applyEvents(xapiEvents: ParsedXapiEvent[]): Promise<void> {
    this.seen = true
    const filteredXapiEvents = xapiEvents.filter(
      (xapiEvent) =>
        xapiEvent.score !== undefined && xapiEvent.response !== undefined,
    )
    await this.addAnswers(filteredXapiEvents)
  }

  constructor(roomId: string, studentId: string, contentKey: string) {
    super()
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    this.seen = false
    if (roomId == null) {
      // typeorm is making the call, so don't overwrite answers.
      return
    }
    this.answers = Promise.resolve([])
  }

  public static new(
    roomId: string,
    studentId: string,
    contentKey: string,
    contentType: string | undefined,
    contentName?: string,
    contentParentId?: string | null,
  ): UserContentScore {
    const userContentScore = new UserContentScore(roomId, studentId, contentKey)
    userContentScore.contentType = contentType
    userContentScore.contentName = contentName
    userContentScore.contentParentId = contentParentId

    return userContentScore
  }

  protected async addAnswer(xapiEvent: ParsedXapiEvent): Promise<void> {
    let answers = await this.answers
    if (!answers) {
      answers = []
      this.answers = Promise.resolve(answers)
    }
    const answer = Answer.new(
      this,
      new Date(xapiEvent.timestamp),
      xapiEvent.response,
      // TODO: Maybe pass whole score object, instead.
      xapiEvent.score?.raw,
      xapiEvent.score?.min,
      xapiEvent.score?.max,
    )
    console.log(
      'answer =',
      answer.roomId,
      answer.studentId,
      answer.contentKey,
      answer.timestamp,
    )
    const duplicates = answers.filter((a) => {
      console.log('a ===>', a.roomId, a.studentId, a.contentKey, a.timestamp)
      return (
        a.roomId === answer.roomId &&
        a.studentId === answer.studentId &&
        a.contentKey === answer.contentKey &&
        a.timestamp === answer.timestamp
      )
    })
    console.log(`====================> answers found ${answers.length}`)
    console.log(`====================> duplicates found ${duplicates.length}`)

    if (duplicates.length == 0) {
      answers.push(answer)
    }
  }

  protected async addAnswers(xapiEvents: ParsedXapiEvent[]): Promise<void> {
    let answers = await this.answers
    if (!answers) {
      answers = []
      this.answers = Promise.resolve(answers)
    }
    const newAnswers = xapiEvents.map((xapiEvent) =>
      Answer.new(
        this,
        new Date(xapiEvent.timestamp),
        xapiEvent.response,
        // TODO: Maybe pass whole score object, instead.
        xapiEvent.score?.raw,
        xapiEvent.score?.min,
        xapiEvent.score?.max,
      ),
    )
    answers.push(...newAnswers)
  }
}
