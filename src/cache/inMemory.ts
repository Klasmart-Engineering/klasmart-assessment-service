import { ICache } from './interface'
import { Content } from '../db/cms/entities/content'

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
    return lessonMaterial
  }

  public async setLessonMaterial(material: Content): Promise<void> {
    this.lessonMaterialCache.set(material.contentId, material)
  }

  public async getLessonPlanMaterials(
    cacheKey: string,
  ): Promise<Content[] | undefined> {
    const cachedMaterialIds = this.lessonPlanMaterialIdsCache.get(cacheKey)
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
    for (const material of materials) {
      materialIds.push(material.contentId)
      this.lessonMaterialCache.set(material.contentId, material)
    }
    this.lessonPlanMaterialIdsCache.set(cacheKey, materialIds)
  }

  public async flush(): Promise<void> {
    this.lessonMaterialCache.clear()
    this.lessonPlanMaterialIdsCache.clear()
  }

  public setRecurringFlush(ms: number): NodeJS.Timeout {
    return setInterval(() => this.flush(), ms)
  }
}

const removeNulls = <S>(value: S | undefined): value is S => value != null
