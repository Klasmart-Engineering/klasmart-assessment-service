import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'

@ObjectType()
export class ContentScores {
  public readonly contentId: string

  @Field(() => [UserContentScore])
  public readonly scores: UserContentScore[]

  public readonly contentType: string | undefined

  constructor(
    content_id: string,
    scores: UserContentScore[] = [],
    contentType: string | undefined,
  ) {
    this.contentId = content_id
    this.scores = scores
    this.contentType = contentType
  }
}
