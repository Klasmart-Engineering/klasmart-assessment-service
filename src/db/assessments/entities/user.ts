import { ObjectType, Field } from "type-graphql"
import { v4 } from "uuid"

@ObjectType()
export class User {
  @Field()
  public user_id: string = v4()
  
  @Field({nullable: true})
  public given_name?: string
  @Field({nullable: true})
  public family_name?: string

  constructor(given_name?: string, family_name?: string) {
    this.given_name = given_name
    this.family_name = family_name
  }
}