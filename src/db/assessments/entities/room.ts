import { Field, ObjectType } from 'type-graphql'
import { v4 } from 'uuid'
import {
  randomInt,
  randomUsers,
  randomContents,
  randomAnswer,
  randomTeacherComments,
} from '../../../random'
import { Content } from './material'
import { ScoreSummary } from './scoreSummary'
import { TeacherComment } from './teacherComments'
import { User } from './user'
import { UserContentScore } from './userContentScore'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'room' })
@ObjectType()
export class Room {
  @PrimaryColumn()
  @Field()
  public room_id: string

  @Field((type) => [UserContentScore])
  public scores: UserContentScore[] = []
  public scoresByUser: Map<User, UserContentScore[]> = new Map()
  public scoresByContent: Map<Content, UserContentScore[]> = new Map()

  public users: User[]
  public contents: Content[]

  @Field((type) => [TeacherComment])
  public teacherComments: TeacherComment[]
  public teacherCommentsByStudent: Map<User, TeacherComment[]> = new Map()

  @Column()
  public start_time: Date

  @Column()
  public end_time: Date

  constructor(
    room_id = v4(),
    users = randomUsers(randomInt(4, 0, 0.5)),
    contents = randomContents(randomInt(5, 0, 0.5)),
  ) {
    this.room_id = room_id
    this.users = users
    this.contents = contents
    this.teacherComments = randomTeacherComments(
      room_id,
      randomInt(users.length),
      randomUsers(randomInt(2, 1)),
      this.users,
    )

    const start =
      Date.now() - randomInt(1000 * 60 * 60 * 24 * 365, 1000 * 60 * 60, 0.5)
    const duration = randomInt(1000 * 60 * 90, 1000 * 60 * 5, 1.5)
    this.start_time = new Date(start)
    this.end_time = new Date(start + duration)

    function addToMap<T, U>(map: Map<T, U[]>, key: T, score: U) {
      const array = map.get(key)
      if (array) {
        array.push(score)
      } else {
        map.set(key, [score])
      }
    }

    for (const user of users) {
      for (const content of contents) {
        const score = new ScoreSummary()
        const count = randomInt(10, 0, 2)
        for (let i = 0; i < count; i++) {
          score.addAnswer(
            randomAnswer(room_id, user.user_id, content.content_id, content),
          )
        }
        const userContentScores = new UserContentScore(
          room_id,
          user,
          content,
          score,
        )
        this.scores.push(userContentScores)
        addToMap(this.scoresByUser, user, userContentScores)
        addToMap(this.scoresByContent, content, userContentScores)
      }
    }

    for (const comment of this.teacherComments) {
      addToMap(this.teacherCommentsByStudent, comment.student, comment)
    }
  }
}
