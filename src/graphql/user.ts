import { ObjectType, Field } from 'type-graphql'
import { v4 } from 'uuid'
import { pick } from '../random'

@ObjectType()
export class User {
  @Field()
  public user_id: string

  @Field({ nullable: true })
  public given_name?: string
  @Field({ nullable: true })
  public family_name?: string

  constructor(user_id: string, given_name?: string, family_name?: string) {
    this.user_id = user_id
    this.given_name = given_name
    this.family_name = family_name
  }

  public static random(
    user_id = v4(),
    given_name = pick(adjectives),
    family_name = pick(names),
  ) {
    return new User(user_id, given_name, family_name)
  }
}

const adjectives = [
  'Awesome',
  'Brilliant',
  'Clever',
  'Dependable',
  'Exciting',
  'Fabulous',
  'Gregarious',
  undefined,
]

const names = [
  'Alice',
  'Bob',
  'Chris',
  'Dave',
  'Emily',
  'Fiona',
  'George',
  undefined,
]
