import { ObjectType, Field } from 'type-graphql'

@ObjectType()
export class User {
  public readonly user_id: string

  @Field({ nullable: true })
  public given_name?: string
  @Field({ nullable: true })
  public family_name?: string

  constructor(user_id: string, given_name?: string, family_name?: string) {
    this.user_id = user_id
    this.given_name = given_name
    this.family_name = family_name
  }
}
