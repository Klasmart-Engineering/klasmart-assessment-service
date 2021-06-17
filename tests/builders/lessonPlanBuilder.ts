import { Content } from '../../src/db/cms/entities/content'
import ContentBuilder from './contentBuilder'

export class LessonPlanBuilder extends ContentBuilder {
  private lessonMaterialIds: string[] = []

  public addMaterialId(lessonMaterialId: string): this {
    this.lessonMaterialIds.push(lessonMaterialId)
    return this
  }

  public build(): Content {
    const entity = super.build()
    return {
      ...entity,
      // TODO: Add material id list.
    }
  }
}
