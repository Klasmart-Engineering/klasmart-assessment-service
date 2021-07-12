import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'

@ObjectType()
export class UserScores {
  public readonly userId: string

  @Field(() => [UserContentScore])
  public readonly scores: UserContentScore[]

  constructor(userId: string, scores: UserContentScore[]) {
    this.userId = userId
    this.scores = scores
  }
}
