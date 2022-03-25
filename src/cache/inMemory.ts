import { withLogger } from 'kidsloop-nodejs-logger'
import { ICache } from './interface'
import { Content } from '../db/cms/entities/content'

const logger = withLogger('InMemoryCache')

export class InMemoryCache implements ICache {
  private readonly lessonMaterialCache = new Map<string, Content>()

  public async getLessonMaterial(
    contentId: string,
  ): Promise<Content | undefined> {
    const lessonMaterial = this.lessonMaterialCache.get(contentId)
    logger.debug(
      `getLessonMaterial >> contentId: ${contentId}, ${
        lessonMaterial ? 'HIT' : 'MISS'
      }`,
    )
    return lessonMaterial
  }

  public async setLessonMaterial(material: Content): Promise<void> {
    logger.debug(`setLessonMaterial >> contentId: ${material.contentId}`)
    this.lessonMaterialCache.set(material.contentId, material)
  }

  public async setLessonPlanMaterials(materials: Content[]): Promise<void> {
    const materialIds: string[] = []
    logger.debug(
      `setLessonPlanMaterials >> materials count: ${materials.length}`,
    )
    for (const material of materials) {
      materialIds.push(material.contentId)
      this.lessonMaterialCache.set(material.contentId, material)
    }
  }

  public async flush(): Promise<void> {
    logger.debug(`flush >> keys found: ${this.lessonMaterialCache.size}`)
    this.lessonMaterialCache.clear()
  }

  public setRecurringFlush(ms: number): NodeJS.Timeout {
    logger.debug(`setRecurringFlush >> ms: ${ms}`)
    return setInterval(() => this.flush(), ms)
  }
}

const removeNulls = <S>(value: S | undefined): value is S => value != null
