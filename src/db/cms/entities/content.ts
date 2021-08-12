/* eslint-disable @typescript-eslint/no-unused-vars */
import { AfterLoad, Column, Entity, PrimaryColumn } from 'typeorm'
import { ObjectType, Field, Directive, ID } from 'type-graphql'
import { ContentType } from '../enums/contentType'
import { FileType } from '../enums'

@ObjectType()
@Entity({ name: 'cms_contents' })
export class Content {
  @Field({ name: 'content_id' })
  @PrimaryColumn({ name: 'id' })
  readonly contentId!: string

  @Field({ name: 'subcontent_id', nullable: true })
  subcontentId?: string

  @Field(() => String, { name: 'parent_id', nullable: true })
  parentId?: string | null

  @Field({ name: 'h5p_id', nullable: true })
  h5pId?: string

  fileType?: FileType

  @Column('enum', { name: 'content_type', enum: ContentType })
  readonly contentType!: ContentType

  @Field({ nullable: true })
  @Column({ name: 'content_name' })
  name!: string

  @Column({ name: 'author' })
  readonly author!: string

  @Column({ type: 'json', name: 'data', nullable: true })
  readonly data?: JSON

  @Column({ type: 'bigint', name: 'create_at' })
  readonly createdAt!: number

  @Column({ name: 'publish_status', default: 'draft' })
  readonly publishStatus!: string

  @Field(() => String, { nullable: true })
  type?: string | null

  @AfterLoad()
  populateH5pId(): void {
    const typedData = (this.data as unknown) as IMaterial
    if (typedData == null) {
      return
    }
    this.fileType = typedData.file_type
    if (this.fileType === FileType.H5P) {
      this.h5pId = typedData.source
    }
  }
}

interface IMaterial {
  source: string
  file_type: FileType
}
