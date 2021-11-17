import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { Mutable } from '../utils/mutable'
import { ContentType } from '../../src/db/cms/enums/contentType'

export default class ContentBuilder {
  private contentId = v4()
  private subcontentId?: string
  private parentId?: string
  private contentType = ContentType.LessonMaterial
  private name = 'Default Content Name'
  private author = v4()
  protected data?: JSON
  private createdAt = Date.now()
  private publishStatus = 'published'
  protected isDataDefined = true

  public withContentId(value: string): this {
    this.contentId = value
    return this
  }

  public withContentType(value: ContentType): this {
    this.contentType = value
    return this
  }

  public withName(value: string): this {
    this.name = value
    return this
  }

  public withAuthor(value: string): this {
    this.author = value
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

  public build(): Content {
    const entity = new Content(
      this.contentId,
      this.author,
      this.name,
      this.contentType,
      this.createdAt,
      this.data,
      this.publishStatus,
    )
    const mutableEntity: Mutable<Content> = entity
    mutableEntity.subcontentId = this.subcontentId
    mutableEntity.parentId = this.parentId
    return entity
  }
}
