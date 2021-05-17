import { ObjectType, Field } from "type-graphql"
import { v4 } from "uuid"

@ObjectType()
export class Content {
  @Field()
  public content_id: string = v4()
  
  @Field()
  public name: string

  public minimumPossibleScore: number
  public maximumPossibleScore: number

  constructor(
    name: string,
    scoreRange = 10,
    minimumPossibleScore = 0,
  ) {
    this.name = name
    this.minimumPossibleScore = minimumPossibleScore
    this.maximumPossibleScore = minimumPossibleScore + scoreRange
  }
}