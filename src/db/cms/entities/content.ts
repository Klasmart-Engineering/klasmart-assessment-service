/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'

@Directive(`@key(fields: "id")`)
@ObjectType()
@Entity({ name: 'cms_contents' })
export class Content {
  @Field()
  @PrimaryColumn({ name: 'id' })
  readonly content_id!: string

  @Column({ name: 'content_type' })
  readonly content_type!: number

  @Field()
  readonly type?: string

  @Field()
  @Column({ name: 'content_name' })
  readonly name?: string

  @Column({ name: 'author' })
  readonly author?: string

  @Column({ type: 'json', name: 'data' })
  readonly data?: JSON

  @Column({ name: 'create_at' })
  readonly createdAt!: number

  public minimumPossibleScore: number
  public maximumPossibleScore: number

  constructor(
    content_id: string,
    name: string,
    type: string,
    scoreRange = 10,
    minimumPossibleScore = 0,
  ) {
    this.content_id = content_id
    this.name = name
    this.type = type
    this.minimumPossibleScore = minimumPossibleScore
    this.maximumPossibleScore = minimumPossibleScore + scoreRange
  }
}
