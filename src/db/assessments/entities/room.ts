import { v4 } from 'uuid'
import { Field, ObjectType } from 'type-graphql'
import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm'
import { TeacherComment } from './teacherComments'
import { UserContentScore } from './userContentScore'
import { Base } from './base'
import {
  ContentScores,
  TeacherCommentsByStudent,
  UserScores,
} from '../../../graphql'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('Room')

@Entity({ name: 'assessment_xapi_room' })
@ObjectType()
export class Room extends Base {
  @PrimaryColumn({ name: 'room_id' })
  @Field({ name: 'room_id' })
  public readonly roomId: string

  @Field(() => [UserContentScore])
  @OneToMany(
    () => UserContentScore,
    (userContentScore) => userContentScore.room,
    { lazy: true, cascade: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public scores!: Promise<ReadonlyArray<UserContentScore>>

  @Field(() => [TeacherComment])
  @OneToMany(
    () => TeacherComment,
    (userContentScore) => userContentScore.room,
    { lazy: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public teacherComments!: Promise<ReadonlyArray<TeacherComment>>

  @Column({ type: 'timestamp', nullable: true })
  public startTime?: Date | null

  @Column({ type: 'timestamp', nullable: true })
  public endTime?: Date | null

  @Column({ type: 'smallint', name: 'attendance_count', nullable: true })
  public attendanceCount?: number | null

  @Column({ default: false })
  public recalculate!: boolean

  constructor(roomId = v4(), startTime?: Date, endTime?: Date) {
    super()
    this.roomId = roomId
    this.startTime = startTime
    this.endTime = endTime
  }

  @Field(() => [UserScores])
  public async scoresByUser(): Promise<ReadonlyArray<UserScores>> {
    logger.debug(`Room room_id: ${this.roomId} >> scoresByUser`)

    const scoresByUser: Map<string, UserScores> = new Map()

    const allScores = await this.scores
    for (const userContentScore of allScores) {
      const userScores = scoresByUser.get(userContentScore.studentId)
      if (userScores) {
        userScores.scores.push(userContentScore)
      } else {
        scoresByUser.set(
          userContentScore.studentId,
          new UserScores(userContentScore.studentId, [userContentScore]),
        )
      }
    }
    logger.debug(
      `Room >> scoresByUser >> users count: ${scoresByUser.size}, ` +
        `total scores count: ${allScores.length}`,
    )

    return [...scoresByUser.values()]
  }

  @Field(() => [ContentScores])
  public async scoresByContent(): Promise<ReadonlyArray<ContentScores>> {
    logger.debug(`Room room_id: ${this.roomId} >> scoresByContent`)

    const scoresByContent: Map<string, ContentScores> = new Map()

    const allScores = await this.scores
    for (const userContentScore of allScores) {
      const contentScores = scoresByContent.get(userContentScore.contentKey)
      if (contentScores) {
        contentScores.scores.push(userContentScore)
      } else {
        scoresByContent.set(
          userContentScore.contentKey,
          new ContentScores(
            userContentScore.contentKey,
            [userContentScore],
            userContentScore.contentType,
            userContentScore.contentName,
            userContentScore.contentParentId,
          ),
        )
      }
    }
    logger.debug(
      `Room room_id: ${this.roomId} >> scoresByContent >> ` +
        `content count: ${scoresByContent.size}, ` +
        `total scores count: ${allScores.length}`,
    )

    return [...scoresByContent.values()]
  }

  @Field(() => [TeacherCommentsByStudent])
  public async teacherCommentsByStudent(): Promise<
    ReadonlyArray<TeacherCommentsByStudent>
  > {
    logger.debug(`Room room_id: ${this.roomId} >> teacherCommentsByStudent`)
    const commentsByStudent: Map<string, TeacherCommentsByStudent> = new Map()

    const allTeacherComments = await this.teacherComments
    for (const comment of await this.teacherComments) {
      const teacherComments = commentsByStudent.get(comment.studentId)
      if (teacherComments) {
        teacherComments.teacherComments.push(comment)
      } else {
        commentsByStudent.set(
          comment.studentId,
          new TeacherCommentsByStudent(comment.studentId, [comment]),
        )
      }
    }
    logger.debug(
      `Room room_id: ${this.roomId} >> teacherCommentsByStudent >> ` +
        `students count: ${commentsByStudent.size}, ` +
        `total comments count: ${allTeacherComments.length}`,
    )

    return [...commentsByStudent.values()]
  }
}
