import { ObjectType, Field } from 'type-graphql'
import { TypeormLoader } from 'type-graphql-dataloader'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  getRepository,
} from 'typeorm'
import { Answer } from './answer'
import { Base } from './base'
import { Room } from './room'
import { ScoreSummary } from '../../../graphql'
import { TeacherScore } from './teacherScore'
import { ParsedXapiEvent } from '../../../helpers/parsedXapiEvent'
import { ASSESSMENTS_CONNECTION_NAME } from '../connectToAssessmentDatabase'

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

  @OneToMany(() => Answer, (answer) => answer.userContentScore, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn([
    { name: 'room_id', referencedColumnName: 'room_id' },
    { name: 'student_id', referencedColumnName: 'student_id' },
    { name: 'content_id', referencedColumnName: 'content_id' },
  ])
  @TypeormLoader()
  public answers: Promise<Answer[]>

  public async getAnswers(): Promise<Answer[]> {
    return getRepository(Answer, ASSESSMENTS_CONNECTION_NAME).find({
      where: {
        roomId: this.roomId,
        studentId: this.studentId,
        contentKey: this.contentKey,
      },
    })
  }

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
    return new ScoreSummary((await this.getAnswers()) ?? [])
  }

  @Column({ type: 'varchar', nullable: true })
  public contentType?: string | null

  @Column({ type: 'varchar', nullable: true })
  public contentName?: string | null

  @Column({ type: 'varchar', nullable: true })
  public contentParentId?: string | null

  public async applyEvent(
    xapiEvent: ParsedXapiEvent,
  ): Promise<Answer | undefined> {
    this.seen = true
    const score = xapiEvent.score?.raw
    const response = xapiEvent.response
    if (score === undefined && response === undefined) {
      console.warn('applyEvent > xapiEvent does not have a response or score')
      return
    }
    return await this.addAnswer(xapiEvent)
  }

  public async applyEvents(xapiEvents: ParsedXapiEvent[]): Promise<Answer[]> {
    this.seen = true
    const filteredXapiEvents = xapiEvents.filter(
      (xapiEvent) =>
        xapiEvent.score !== undefined && xapiEvent.response !== undefined,
    )
    return await this.addAnswers(filteredXapiEvents)
  }

  constructor(roomId: string, studentId: string, contentKey: string) {
    super()
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    this.seen = false
    this.answers = Promise.resolve([])
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

  protected async addAnswer(xapiEvent: ParsedXapiEvent): Promise<Answer> {
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
    answers.push(answer)
    return answer
  }

  protected async addAnswers(xapiEvents: ParsedXapiEvent[]): Promise<Answer[]> {
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
    console.log(
      `pushing newAnswers ${newAnswers.length} to existing ${answers.length} answers`,
    )
    answers.push(...newAnswers)
    console.log(`now there are ${answers.length} answers`)
    return answers
  }

  public async addReadyAnswer(answer: Answer): Promise<void> {
    let answers = await this.answers
    if (!answers) {
      answers = [answer]
      this.answers = Promise.resolve(answers)
    } else {
      answers.push(answer)
    }
    return
  }
}
