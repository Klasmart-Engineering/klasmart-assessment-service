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

  private _type?: string
  private _fileType?: FileType
  readonly publishStatus!: string

  @Field(() => FileType, { nullable: true })
  get fileType(): string | undefined {
    return this._fileType as never
  }

  @Field(() => String, { nullable: true })
  get type(): string | undefined {
    return this._type ?? this.fileType
  }
  set type(value: string | undefined) {
    this._type = value
  }

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
    const result = new Content(
      content.contentId,
      content.name,
      content.publishStatus,
      undefined,
    )
    result._fileType = content._fileType
    result._type = content._type
    result.h5pId = content.h5pId
    result.parentId = content.parentId
    result.subcontentId = content.subcontentId
    return result
  }

  populateH5pId(data: JSON | undefined): void {
    const typedData = data as unknown as IMaterial
    if (typedData == null) {
      return
    }
    this._fileType = typedData.file_type
    if (this._fileType === FileType.H5P) {
      this.h5pId = typedData.source
    }
  }
}

interface IMaterial {
  source: string
  file_type: FileType
}
