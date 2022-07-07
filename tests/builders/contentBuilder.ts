import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { FileType } from '../../src/db/cms/enums'
import { Mutable } from '../utils/mutable'

export default class ContentBuilder {
  private contentId = v4()
  private subcontentId?: string
  private parentId?: string
  private name = 'Default Content Name'
  protected data?: JSON
  private publishStatus = 'published'
  protected isDataDefined = true
  private rawSourceId = v4()
  private sourceId? = v4()
  private fileType = FileType.H5P
  private contentType: string | undefined
  private readonly sourceMap = new Map([
    [FileType.H5P, this.rawSourceId],
    [FileType.Image, `assets-${this.rawSourceId}.gif`],
    [FileType.Video, `assets-${this.rawSourceId}.mp4`],
    [FileType.Document, `assets-${this.rawSourceId}.pdf`],
    [FileType.Audio, `assets-${this.rawSourceId}.mp3`],
  ])

  public withContentId(value: string): this {
    this.contentId = value
    return this
  }

  public withName(value: string): this {
    this.name = value
    return this
  }

  public withData(value: JSON): this {
    this.data = value
    return this
  }

  public withSubcontentId(value?: string): this {
    this.subcontentId = value
    return this
  }

  public withParentId(value?: string): this {
    this.parentId = value
    return this
  }

  public withPublishStatus(value: 'published' | 'hidden' | 'draft'): this {
    this.publishStatus = value
    return this
  }

  public withUndefinedData(): this {
    this.isDataDefined = false
    return this
  }

  public withSource(fileType: FileType, id?: string): this {
    this.fileType = fileType
    this.sourceId = id ?? this.sourceMap.get(fileType)
    return this
  }

  public withUndefinedH5pId(): this {
    this.fileType = FileType.H5P
    this.sourceId = undefined
    return this
  }

  public withContentType(value?: string): this {
    this.contentType = value
    return this
  }

  public build(): Content {
    const entity = new Content(
      this.contentId,
      this.name,
      this.publishStatus,
      this.data,
    )
    const mutableEntity: Mutable<Content> = entity
    mutableEntity.subcontentId = this.subcontentId
    mutableEntity.parentId = this.parentId
    entity.type = this.contentType
    if (this.isDataDefined) {
      const data: unknown = {
        source: this.sourceId,
        file_type: this.fileType.valueOf(),
        input_source: 1,
      }
      entity['populateH5pId'](data as JSON)
    }
    return entity
  }
}
