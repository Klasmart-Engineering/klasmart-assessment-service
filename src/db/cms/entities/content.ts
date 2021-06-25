/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'
import { ContentType } from '../enums/contentType'

@ObjectType()
@Entity({ name: 'cms_contents' })
export class Content {
  @Field({ name: 'content_id' })
  @PrimaryColumn({ name: 'id' })
  readonly contentId!: string

  @Field({ name: 'subcontent_id', nullable: true })
  subcontentId?: string

  @Field({ name: 'h5p_id', nullable: true })
  h5pId?: string

  @Column('enum', { name: 'content_type', enum: ContentType })
  readonly contentType!: ContentType

  @Field({ nullable: true })
  @Column({ name: 'content_name' })
  readonly name!: string

  @Column({ name: 'author' })
  readonly author!: string

  @Column({ type: 'json', name: 'data', nullable: true })
  readonly data?: JSON

  @Column({ type: 'bigint', name: 'create_at' })
  readonly createdAt!: number

  @Field({ nullable: true })
  type?: string
}
