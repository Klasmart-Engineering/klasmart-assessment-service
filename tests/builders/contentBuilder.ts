import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
import { Mutable } from '../utils/mutable'
import { ContentType } from '../../src/db/cms/enums/contentType'

export default class ContentBuilder {
  private contentId = v4()
  private contentType = ContentType.LessonMaterial
  private type? = 'Flashcards'
  private name? = 'My Content'
  private author? = v4()
  protected data?: JSON
  private createdAt = Date.now()

  public withContentId(value: string): this {
    this.contentId = value
    return this
  }

  public withContentType(value: ContentType): this {
    this.contentType = value
    return this
  }

  public withType(value: string): this {
    this.type = value
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

  public build(): Content {
    const entity = new Content()
    const mutableEntity: Mutable<Content> = entity
    mutableEntity.content_id = this.contentId
    mutableEntity.content_type = this.contentType
    mutableEntity.type = this.type
    mutableEntity.name = this.name
    mutableEntity.author = this.author
    mutableEntity.createdAt = this.createdAt
    return entity
  }

  public async buildAndPersist(): Promise<Content> {
    const entity = this.build()
    return await getRepository(Content, CMS_CONNECTION_NAME).save(entity)
  }
}
