import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities/userContentScore'

@ObjectType()
export class ContentScores {
  public readonly content_id: string

  @Field(() => [UserContentScore])
  public scores: UserContentScore[]

  constructor(content_id: string, scores: UserContentScore[] = []) {
    this.content_id = content_id
    this.scores = scores
  }
}
