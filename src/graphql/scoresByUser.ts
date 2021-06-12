import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'

@ObjectType()
export class UserScores {
  public readonly user_id: string

  @Field(() => [UserContentScore])
  public readonly scores: UserContentScore[]

  constructor(user_id: string, scores: UserContentScore[] = []) {
    this.user_id = user_id
    this.scores = scores
  }
}
