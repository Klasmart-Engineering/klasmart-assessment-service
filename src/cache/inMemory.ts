import { withLogger } from 'kidsloop-nodejs-logger'
import { ICache } from './interface'
import { Content } from '../db/cms/entities/content'

const logger = withLogger('InMemoryCache')

export class InMemoryCache implements ICache {
  private readonly lessonMaterialCache = new Map<string, Content>()
  private readonly lessonPlanMaterialIdsCache = new Map<
    string,
    ReadonlyArray<string>
  >()

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

  public async getLessonPlanMaterials(
    cacheKey: string,
  ): Promise<Content[] | undefined> {
    const cachedMaterialIds = this.lessonPlanMaterialIdsCache.get(cacheKey)
    logger.debug(
      `getLessonPlanMaterials >> cacheKey: ${cacheKey}, materials found:` +
        ` ${cachedMaterialIds?.length}`,
    )
    if (cachedMaterialIds) {
      return [
        ...cachedMaterialIds
          .map((id) => this.lessonMaterialCache.get(id))
          .filter(removeNulls),
      ]
    }
    return undefined
  }

  public async setLessonPlanMaterials(
    cacheKey: string,
    materials: Content[],
  ): Promise<void> {
    const materialIds: string[] = []
    logger.debug(
      `setLessonPlanMaterials >> cacheKey: ${cacheKey}, ` +
        `materials count: ${materials.length}`,
    )
    for (const material of materials) {
      materialIds.push(material.contentId)
      this.lessonMaterialCache.set(material.contentId, material)
    }
    this.lessonPlanMaterialIdsCache.set(cacheKey, materialIds)
  }

  public async flush(): Promise<void> {
    logger.debug(
      `flush >> keys found: ${
        this.lessonMaterialCache.size + this.lessonPlanMaterialIdsCache.size
      }`,
    )
    this.lessonMaterialCache.clear()
    this.lessonPlanMaterialIdsCache.clear()
  }

  public setRecurringFlush(ms: number): NodeJS.Timeout {
    logger.debug(`setRecurringFlush >> ms: ${ms}`)
    return setInterval(() => this.flush(), ms)
  }
}

const removeNulls = <S>(value: S | undefined): value is S => value != null
