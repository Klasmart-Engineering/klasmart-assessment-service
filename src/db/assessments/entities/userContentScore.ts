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
import { Content } from '../../cms/entities/content'

@Entity({ name: 'assessment_xapi_user_content_score' })
@ObjectType()
export class UserContentScore extends Base {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId!: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId!: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly contentKey!: string

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
  public answers!: Promise<Answer[]>

  // TODO: Is this only being used by tests?
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
  public seen!: boolean

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

  public content: Content | null = null

  constructor(roomId: string, studentId: string, contentKey: string) {
    super()
    if (roomId == null) {
      // typeorm is making the call, so don't overwrite values.
      return
    }
    this.roomId = roomId
    this.studentId = studentId
    this.contentKey = contentKey
    this.answers = Promise.resolve([])
  }

  public static new(
    roomId: string,
    studentId: string,
    contentKey: string,
    content?: Content,
  ): UserContentScore {
    const userContentScore = new UserContentScore(roomId, studentId, contentKey)
    userContentScore.seen = false
    userContentScore.content = content ?? null
    userContentScore.contentType = content?.type
    userContentScore.contentName = content?.name
    userContentScore.contentParentId = content?.parentId

    return userContentScore
  }

  public async applyEvent(
    xapiEvent: ParsedXapiEvent,
  ): Promise<Answer | undefined> {
    this.seen = true
    const score = xapiEvent.score?.raw
    const response = xapiEvent.response
    if (score === undefined && response === undefined) {
      return
    }
    return await this.addAnswer(xapiEvent)
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
      xapiEvent.score?.raw,
      xapiEvent.score?.min,
      xapiEvent.score?.max,
    )
    answers.push(answer)
    return answer
  }
}
