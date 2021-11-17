/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectType, Field } from 'type-graphql'
import { ContentType } from '../enums/contentType'
import { FileType } from '../enums'

@ObjectType()
export class Content {
  @Field({ name: 'content_id' })
  readonly contentId!: string

  @Field({ name: 'subcontent_id', nullable: true })
  subcontentId?: string

  @Field(() => String, { name: 'parent_id', nullable: true })
  parentId?: string | null

  @Field({ name: 'h5p_id', nullable: true })
  h5pId?: string

  @Field({ nullable: true })
  name!: string

  @Field(() => String, { nullable: true })
  type?: string | null

  fileType?: FileType
  readonly contentType!: ContentType
  readonly author!: string
  readonly data?: JSON
  readonly createdAt!: number
  readonly publishStatus!: string

  constructor(
    contentId: string,
    authorId: string,
    contentName: string,
    contentType: ContentType,
    createdAt: number,
    data: JSON | undefined,
    publishStatus: string,
  ) {
    this.contentId = contentId
    this.author = authorId
    this.name = contentName
    this.contentType = contentType
    this.createdAt = createdAt
    this.data = data
    this.publishStatus = publishStatus
    this.populateH5pId()
  }

  populateH5pId(): void {
    const typedData = this.data as unknown as IMaterial
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
