import { ObjectType, Field } from 'type-graphql'
import { UserContentScore } from '../db/assessments/entities'

@ObjectType()
export class ContentScores {
  public readonly contentKey: string

  @Field(() => [UserContentScore])
  public readonly scores: UserContentScore[]

  public readonly contentType?: string | null
  public readonly contentName?: string | null
  public readonly parentId?: string | null

  constructor(
    contentKey: string,
    scores: UserContentScore[],
    contentType: string | undefined | null,
    contentName: string | undefined | null,
    parentId: string | undefined | null,
  ) {
    this.contentKey = contentKey
    this.scores = scores
    this.contentType = contentType
    this.contentName = contentName
    this.parentId = parentId
  }
}
