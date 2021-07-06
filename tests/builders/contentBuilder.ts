import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
import { Mutable } from '../utils/mutable'
import { ContentType } from '../../src/db/cms/enums/contentType'

export default class ContentBuilder {
  private contentId = v4()
  private subcontentId?: string
  private contentType = ContentType.LessonMaterial
  private name = 'Default Content Name'
  private author = v4()
  protected data?: JSON
  private createdAt = Date.now()
  private publishStatus = 'published'

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

  public build(): Content {
    const entity = new Content()
    const mutableEntity: Mutable<Content> = entity
    mutableEntity.contentId = this.contentId
    mutableEntity.subcontentId = this.subcontentId
    mutableEntity.contentType = this.contentType
    mutableEntity.name = this.name
    mutableEntity.author = this.author
    mutableEntity.createdAt = this.createdAt
    mutableEntity.publishStatus = this.publishStatus
    return entity
  }

  public async buildAndPersist(): Promise<Content> {
    const entity = this.build()
    return await getRepository(Content, CMS_CONNECTION_NAME).save(entity)
  }
}
