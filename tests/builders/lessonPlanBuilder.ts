import { Mutable } from '../utils/mutable'
import { LessonPlan } from '../../src/db/cms/entities/lessonPlan'
import { v4 } from 'uuid'
import { getRepository } from 'typeorm'
import { ContentType } from '../../src/db/cms/enums/contentType'

export default class LessonPlanBuilder {
  private contentId = v4()
  private name = 'My Content'
  private author = v4()
  private createdAt = Date.now()
  protected isDataDefined = true
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

  public withUndefinedData(): this {
    this.isDataDefined = false
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

    if (this.isDataDefined) {
      mutableEntity.data = this.createMaterialLinkedList()
    }
    return entity
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
