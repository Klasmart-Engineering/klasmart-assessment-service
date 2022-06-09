import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { Mutable } from '../utils/mutable'

export default class ContentBuilder {
  private contentId = v4()
  private subcontentId?: string
  private parentId?: string
  private name = 'Default Content Name'
  protected data?: JSON
  private publishStatus = 'published'
  protected isDataDefined = true

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
    return entity
  }
}
