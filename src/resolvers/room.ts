import {
    Arg,
    Field,
    FieldResolver, 
    Float, 
    ObjectType,
    Query,
    Resolver,
    Root,
  } from 'type-graphql'
import { Service } from 'typedi'
  import { v4 } from 'uuid'
import { randomInt, pick, randomUsers, randomContents, randomAnswer } from '../random'
import { Content } from './material'
import { Score } from './score'
import { ContentScores } from './scoresByContent'
import { UserScores } from './scoresByUser'
import { User } from './user'
import { UserContentScore } from './userContentScore'

@ObjectType()
export class Room {
  @Field()
  public room_id: string

  @Field(type => [UserContentScore])
  public scores: UserContentScore[] = []
  public scoresByUser: Map<User, UserContentScore[]> = new Map()
  public scoresByContent: Map<Content, UserContentScore[]> = new Map()

  public users: User[]
  public contents: Content[]

  public start_time: Date
  public end_time: Date

  constructor(
    room_id = v4(),
    users = randomUsers(randomInt(4,0)),
    contents = randomContents(randomInt(5,0)),
  ) {
    this.room_id = room_id
    this.users = users
    this.contents = contents

    const start = Date.now() - randomInt(1000*60*60*24*365, 1000*60*60, 0.5)
    const duration = randomInt(1000*60*90, 1000*60*5, 1.5)
    this.start_time = new Date(start)
    this.end_time = new Date(start+duration)

    function addScore<T>(map: Map<T, UserContentScore[]>, key: T, score: UserContentScore) {
      let array = map.get(key)
      if(array) {
        array.push(score)
      } else {
        map.set(key, [score])
      }
    }
    for(const user of users) {
      for(const content of contents) {
        const score = new Score()
        const count = randomInt(10,0,2)
        for(let i = 0; i < count; i++) {
          score.addAnswer(randomAnswer(content))
        }
        const userContentScores = new UserContentScore(user, content, score)
        this.scores.push(userContentScores)
        addScore(this.scoresByUser, user, userContentScores)
        addScore(this.scoresByContent, content, userContentScores)
      }
    }

  }
}

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  @Query(type => Room)
  public async Room(
    @Arg('room_id', { nullable: true }) room_id: string
  ) {
    return new Room(room_id)
  }

  @FieldResolver(type => [UserScores])
  public async scoresByUser(@Root() room: Room) {
    const entries = [...room.scoresByUser.entries()]
    const userScores = entries.map(([user, scores]) => new UserScores(user, scores))
    return userScores
  }

  @FieldResolver(type => [ContentScores])
  public async scoresByContent(@Root() room: Room) {
    const entries = [...room.scoresByContent.entries()]
    const contentScores = entries.map(([content, scores]) => new ContentScores(content, scores))
    return contentScores
  }
}