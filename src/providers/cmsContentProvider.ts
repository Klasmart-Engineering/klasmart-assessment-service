import { Service } from 'typedi'
import { Content } from '../db/cms/entities/content'
import { throwExpression } from '../helpers/throwExpression'
import { CmsContentApi, ContentDto } from '../web/cms'

@Service()
export class CmsContentProvider {
  private readonly lessonMaterialCache = new Map<string, Content>()
  private readonly lessonPlanMaterialIdsCache = new Map<
    string,
    ReadonlyArray<string>
  >()

  constructor(private readonly cmsContentApi: CmsContentApi) {}

  public async getLessonMaterials(
    lessonPlanId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<Content>> {
    const cachedMaterialIds = this.lessonPlanMaterialIdsCache.get(lessonPlanId)
    if (cachedMaterialIds) {
      return [
        ...cachedMaterialIds
          .map((id) => this.lessonMaterialCache.get(id))
          .filter(removeNulls),
      ]
    }

    const dtos = await this.cmsContentApi.getLessonMaterials(
      lessonPlanId,
      authenticationToken,
    )
    const lessonMaterials = dtos.map((x) => contentDtoToEntity(x))
    this.cacheLessonPlanResults(lessonPlanId, lessonMaterials)

    return lessonMaterials
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<Content | undefined> {
    const cachedResult = this.lessonMaterialCache.get(contentId)
    if (cachedResult) {
      return cachedResult
    }

    const dto = await this.cmsContentApi.getLessonMaterial(
      contentId,
      authenticationToken,
    )
    if (!dto) return undefined
    const lessonMaterial = contentDtoToEntity(dto)
    this.lessonMaterialCache.set(contentId, lessonMaterial)

    return lessonMaterial
  }

  public async getLessonMaterialsWithSourceId(
    sourceId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<Content>> {
    const dtos = await this.cmsContentApi.getLessonMaterialsWithSourceId(
      sourceId,
      authenticationToken,
    )
    const lessonMaterials = dtos.map((x) => contentDtoToEntity(x))

    return lessonMaterials
  }

  /**
   * Clears the caches every [ms] milliseconds
   * @param ms milliseconds
   * @returns intervalId that can be used to stop the recurring function via clearInterval(intervalId)
   */
  public setRecurringCacheClear(ms: number): NodeJS.Timeout {
    return setInterval(
      () =>
        CmsContentProvider.clearCaches(
          this.lessonMaterialCache,
          this.lessonPlanMaterialIdsCache,
        ),
      ms,
    )
  }

  private cacheLessonPlanResults(
    lessonPlanId: string,
    lessonMaterials: ReadonlyArray<Content>,
  ) {
    const lessonMaterialIds: string[] = []
    for (const lessonMaterial of lessonMaterials) {
      lessonMaterialIds.push(lessonMaterial.contentId)
      this.lessonMaterialCache.set(lessonMaterial.contentId, lessonMaterial)
    }
    this.lessonPlanMaterialIdsCache.set(lessonPlanId, lessonMaterialIds)
  }

  private static clearCaches(
    m1: Map<unknown, unknown>,
    m2: Map<unknown, unknown>,
  ) {
    m1.clear()
    m2.clear()
  }
}

function contentDtoToEntity(dto: ContentDto) {
  return new Content(
    dto.id ?? throwExpression('content.id is undefined'),
    dto.author_id ?? throwExpression('content.author_id is undefined'),
    dto.content_name ?? throwExpression('content.content_name is undefined'),
    dto.content_type ?? throwExpression('content.content_type is undefined'),
    dto.create_at ?? throwExpression('content.create_at is undefined'),
    JSON.parse(dto.data ?? throwExpression('content.data is undefined')),
    dto.publish_status ??
      throwExpression('content.publish_status is undefined'),
  )
}

const removeNulls = <S>(value: S | undefined): value is S => value != null
