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
import { Content } from '../../cms/entities/content'
import { User } from '../../../web'
import { RawAnswer } from './rawAnswer'

@Entity({ name: 'assessment_xapi_user_content_score' })
@ObjectType()
export class UserContentScore extends Base {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId!: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId!: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly contentKey!: string

  @Column({ name: 'h5p_id', nullable: true })
  public h5pId?: string

  @Column({ name: 'h5p_sub_id', nullable: true })
  public h5pSubId?: string

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
    return new ScoreSummary((await this.answers) ?? [])
  }

  @Column({ type: 'varchar', nullable: true })
  public contentType?: string | null

  @Column({ type: 'varchar', nullable: true })
  public contentName?: string | null

  @Column({ type: 'varchar', nullable: true })
  public contentParentId?: string | null

  public content: Content | null = null

  @Field(() => User)
  public get user(): User {
    return { userId: this.studentId }
  }

  private constructor(roomId: string, studentId: string, contentKey: string) {
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
    userContentScore.h5pId = content?.h5pId
    userContentScore.h5pSubId = content?.subcontentId

    return userContentScore
  }

  public applyAnswers(rawAnswers: RawAnswer[]) {
    const answers: Answer[] = []
    this.answers = Promise.resolve(answers)
    for (const rawAnswer of rawAnswers) {
      this.seen = true
      const { answer: response, score } = rawAnswer
      if (score == null && response == null) {
        continue
      }
      const answer = Answer.new(
        this,
        rawAnswer.timestamp,
        rawAnswer.answer,
        rawAnswer.score,
        rawAnswer.minimumPossibleScore,
        rawAnswer.maximumPossibleScore,
      )
      answers.push(answer)
    }
  }
}
