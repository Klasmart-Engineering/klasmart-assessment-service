import { Content } from '../db/cms/entities/content'

export interface ICache {
  getLessonMaterial(contentId: string): Promise<Content | undefined>
  setLessonMaterial(material: Content): Promise<void>
  getLessonPlanMaterials(cacheKey: string): Promise<Content[] | undefined>
  setLessonPlanMaterials(cacheKey: string, materials: Content[]): Promise<void>
  flush(): Promise<void>
  /**
   * Clears the caches every [ms] milliseconds
   * @param ms milliseconds
   * @returns intervalId that can be used to stop the recurring function via clearInterval(intervalId)
   */
  setRecurringFlush(ms: number): NodeJS.Timeout
}
