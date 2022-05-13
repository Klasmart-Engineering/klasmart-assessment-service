import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class User {
  @Field({ name: 'userId' })
  @Field({ name: 'user_id', deprecationReason: 'use userId instead' })
  public readonly userId!: string

  @Field({ name: 'givenName', nullable: true })
  @Field({
    name: 'given_name',
    deprecationReason: 'use givenName instead',
    nullable: true,
  })
  public readonly givenName?: string

  @Field({ name: 'familyName', nullable: true })
  @Field({
    name: 'family_name',
    deprecationReason: 'use familyName instead',
    nullable: true,
  })
  public readonly familyName?: string

  @Field({ nullable: true })
  public readonly email?: string
}
