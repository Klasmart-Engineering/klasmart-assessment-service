/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity({ name: 'cms_contents' })
export abstract class CmsContent {
  @Field((type) => ID)
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

  @Field()
  @Column({ name: 'content_type' })
  readonly contentType!: number

  @Field()
  @Column({ name: 'content_name' })
  readonly contentName!: string

  @Field()
  @Column({ name: 'author' })
  readonly author!: string

  @Column({ type: 'json', name: 'data' })
  readonly data?: JSON

  @Column({ name: 'create_at' })
  readonly createdAt!: number
}
