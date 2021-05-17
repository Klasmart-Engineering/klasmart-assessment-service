import { ObjectType, Field } from "type-graphql"
import { Content } from "./material"
import { UserContentScore } from "./userContentScore"

@ObjectType()
export class ContentScores {
  @Field()
  public content: Content

  @Field(type => [UserContentScore])
  public scores: UserContentScore[]

  constructor(content: Content, scores: UserContentScore[]) {
    this.content = content
    this.scores = scores
  }
}