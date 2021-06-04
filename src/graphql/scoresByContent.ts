import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'

@ObjectType()
export class ContentScores {
  public readonly content_id: string

  @Field(() => [UserContentScore])
  public scores: UserContentScore[]

  public contentType: string | undefined

  constructor(
    content_id: string,
    scores: UserContentScore[] = [],
    contentType: string | undefined,
  ) {
    this.content_id = content_id
    this.scores = scores
    this.contentType = contentType
  }
}
