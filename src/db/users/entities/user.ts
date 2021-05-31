import { Field, ObjectType } from 'type-graphql'
import { Entity, Column, PrimaryColumn } from 'typeorm'

@ObjectType()
@Entity()
export class User {
  @PrimaryColumn('uuid', { name: 'user_id' })
  @Field()
  public user_id!: string

  @Column({ name: 'given_name', nullable: true })
  @Field({ nullable: true })
  public given_name?: string

  @Column({ name: 'family_name', nullable: true })
  @Field({ nullable: true })
  public family_name?: string
}
