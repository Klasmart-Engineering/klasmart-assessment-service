import { ObjectType, Field } from "type-graphql"

@ObjectType()
export class Answer {
  @Field({nullable: true})
  public answer?: string

  @Field({nullable: true})
  public score?: number

  @Field(type => Date)
  public date = Date.now()

  constructor(
    answer?: string,
    score?: number,
  ) {
      this.answer = answer
      this.score = score
  }
}