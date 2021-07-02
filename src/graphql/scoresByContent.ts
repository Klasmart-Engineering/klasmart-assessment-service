import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'

@ObjectType()
export class ContentScores {
  public readonly contentKey: string

  @Field(() => [UserContentScore])
  public readonly scores: UserContentScore[]

  public readonly contentType: string | undefined
  public readonly contentName: string | undefined

  constructor(
    contentKey: string,
    scores: UserContentScore[] = [],
    contentType: string | undefined,
    contentName?: string | undefined,
  ) {
    this.contentKey = contentKey
    this.scores = scores
    this.contentType = contentType
    this.contentName = contentName
  }
}
