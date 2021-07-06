import { Mutable } from '../utils/mutable'
import { LessonPlan } from '../../src/db/cms/entities/lessonPlan'
import { v4 } from 'uuid'
import { getRepository } from 'typeorm'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
import { ContentType } from '../../src/db/cms/enums/contentType'

export default class LessonPlanBuilder {
  private contentId = v4()
  private name = 'My Content'
  private author = v4()
  private createdAt = Date.now()
  private lessonMaterialIds: string[] = []

  public withContentId(value: string): this {
    this.contentId = value
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

  public addMaterialId(lessonMaterialId: string): this {
    this.lessonMaterialIds.push(lessonMaterialId)
    return this
  }

  public build(): LessonPlan {
    const entity = new LessonPlan()
    const mutableEntity: Mutable<LessonPlan> = entity
    mutableEntity.contentId = this.contentId
    mutableEntity.name = this.name
    mutableEntity.author = this.author
    mutableEntity.createdAt = this.createdAt
    mutableEntity.contentType = ContentType.LessonPlan

    mutableEntity.data = this.createMaterialLinkedList()
    return entity
  }

  public async buildAndPersist(): Promise<LessonPlan> {
    const entity = this.build()
    return await getRepository(LessonPlan, CMS_CONNECTION_NAME).save(entity)
  }

  private createMaterialLinkedList(): JSON {
    const data = {}
    let current = data
    if (this.lessonMaterialIds.length > 0) {
      const newNode = { materialId: this.lessonMaterialIds[0] }
      current = Object.assign(current, newNode)
      for (let index = 1; index < this.lessonMaterialIds.length; index++) {
        const materialId = this.lessonMaterialIds[index]
        const newNode = { materialId }
        Object.assign(current, { next: [newNode] })
        current = newNode
      }
    }
    return JSON.parse(JSON.stringify(data))
  }
}
