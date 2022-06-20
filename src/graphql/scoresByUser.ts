import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'
import { User } from '../web'

@ObjectType()
export class UserScores {
  public readonly userId: string

  @Field(() => [UserContentScore])
  public readonly scores: UserContentScore[]

  @Field(() => User)
  public get user(): User {
    return { userId: this.userId }
  }

  constructor(userId: string, scores: UserContentScore[]) {
    this.userId = userId
    this.scores = scores
  }
}
