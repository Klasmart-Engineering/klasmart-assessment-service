/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'

@ObjectType()
@Entity({ name: 'cms_contents' })
export class Content {
  @Field()
  @PrimaryColumn({ name: 'id' })
  readonly content_id!: string

  @Column({ name: 'content_type' })
  readonly content_type!: number

  @Field({ nullable: true })
  @Column({ name: 'content_name' })
  readonly name?: string

  @Column({ name: 'author' })
  readonly author?: string

  @Column({ type: 'json', name: 'data' })
  readonly data?: JSON

  @Column({ name: 'create_at' })
  readonly createdAt!: number

  @Field({ nullable: true })
  readonly type?: string
}
