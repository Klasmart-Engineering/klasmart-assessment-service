import { ObjectType, Field } from "type-graphql"

@ObjectType()
export class Answer {
  @Field({nullable: true})
  public answer?: string

  @Field({nullable: true})
  public score?: number

  @Field(type => Date)
  public date = new Date()

  @Field()
  public minimumPossibleScore?: number
  @Field()
  public maximumPossibleScore?: number

  constructor(
    answer?: string,
    score?: number,
    minimumPossibleScore?: number,
    maximumPossibleScore?: number,
  ) {
      this.answer = answer
      this.score = score
      this.minimumPossibleScore = minimumPossibleScore
      this.maximumPossibleScore = maximumPossibleScore
  }
}