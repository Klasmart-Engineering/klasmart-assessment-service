import {
  Arg,
  Field,
  FieldResolver,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import { Service } from 'typedi'
import { v4 } from 'uuid'
import { Container } from 'typeorm-typedi-extensions'
import {
  randomInt,
  randomUsers,
  randomContents,
  randomAnswer,
  randomTeacherComments,
} from '../random'
import { Content } from './material'
import { Score } from './score'
import { ContentScores } from './scoresByContent'
import { UserScores } from './scoresByUser'
import { TeacherComment } from './teacherComments'
import { TeacherCommentsByStudent } from './teacherCommentsByUser'
import { User } from './user'
import { UserContentScore } from './userContentScore'
import { UserRepo } from '../db/users/repo'
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
        const score = new Score()
        const count = randomInt(10, 0, 2)
        for (let i = 0; i < count; i++) {
          score.addAnswer(randomAnswer(content))
        }
        const userContentScores = new UserContentScore(user, content, score)
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

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  public userRepo = Container.get(UserRepo)

  @Query((type) => Room)
  public async Room(@Arg('room_id', { nullable: true }) room_id: string) {
    const attendances = this.userRepo.searchAttendances({ roomId: room_id })
    // const room: Room = {
    //   room_id,
    // }
    return new Room(room_id)
  }

  @FieldResolver(type => [UserScores])
  public async scoresByUser(@Root() room: Room) {
    const entries = [...room.scoresByUser.entries()]
    const userScores = entries.map(
      ([user, scores]) => new UserScores(user, scores),
    )
    return userScores
  }

  @FieldResolver((type) => [ContentScores])
  public async scoresByContent(@Root() room: Room) {
    const entries = [...room.scoresByContent.entries()]
    const contentScores = entries.map(
      ([content, scores]) => new ContentScores(content, scores),
    )
    return contentScores
  }

  @FieldResolver((type) => [TeacherCommentsByStudent])
  public async teacherCommentsByStudent(@Root() room: Room) {
    const entries = [...room.teacherCommentsByStudent.entries()]
    const contentScores = entries.map(
      ([student, comments]) => new TeacherCommentsByStudent(student, comments),
    )
    return contentScores
  }
}
