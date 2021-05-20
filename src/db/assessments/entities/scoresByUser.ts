import { ObjectType, Field } from 'type-graphql'
import { User } from './user'
import { UserContentScore } from './userContentScore'

@ObjectType()
export class UserScores {
  @Field()
  public user: User

  @Field((type) => [UserContentScore])
  public scores: UserContentScore[]

  constructor(user: User, scores: UserContentScore[]) {
    this.user = user
    this.scores = scores
  }
}
