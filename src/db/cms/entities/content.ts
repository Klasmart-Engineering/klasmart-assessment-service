/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'
import { ContentType } from '../enums/contentType'

@ObjectType()
@Entity({ name: 'cms_contents' })
export class Content {
  @Field()
  @PrimaryColumn({ name: 'id' })
  readonly content_id!: string

  @Field({ nullable: true })
  subcontent_id?: string

  @Field({ nullable: true })
  h5p_id?: string

  @Column('enum', { name: 'content_type', enum: ContentType })
  readonly content_type!: ContentType

  @Field({ nullable: true })
  @Column({ name: 'content_name' })
  readonly name?: string

  @Column({ name: 'author' })
  readonly author?: string

  @Column({ type: 'json', name: 'data' })
  readonly data?: JSON

  @Column({ type: 'bigint', name: 'create_at' })
  readonly createdAt!: number

  @Field({ nullable: true })
  type?: string
}
