import { ObjectType, Field } from "type-graphql"
import { Content } from "./material"
import { Score } from "./score"
import { User } from "./user"

@ObjectType()
export class UserContentScore {
  @Field()
  public user: User
  @Field()
  public content: Content
  @Field()
  public score: Score

  constructor(user: User, content: Content, score = new Score()) {
    this.user = user
    this.content = content
    this.score = score
  }
}