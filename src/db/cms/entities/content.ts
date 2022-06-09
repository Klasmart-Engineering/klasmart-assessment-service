import { ObjectType, Field } from 'type-graphql'
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
  readonly publishStatus!: string

  constructor(
    contentId: string,
    contentName: string,
    publishStatus: string,
    data: JSON | undefined,
  ) {
    this.contentId = contentId
    this.name = contentName
    this.publishStatus = publishStatus
    this.populateH5pId(data)
  }

  public static clone(content: Content): Content {
    return { ...content, populateH5pId: content.populateH5pId }
  }

  populateH5pId(data: JSON | undefined): void {
    const typedData = data as unknown as IMaterial
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
