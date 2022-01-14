import { Inject, Service } from 'typedi'
import { ICache } from '../cache/interface'
import { Content } from '../db/cms/entities/content'
import { throwExpression } from '../helpers/throwExpression'
import DiKeys from '../initialization/diKeys'
import { CmsContentApi, ContentDto } from '../web/cms'

@Service()
export class CmsContentProvider {
  constructor(
    private readonly cmsContentApi: CmsContentApi,
    @Inject(DiKeys.ICache)
    public readonly cache: ICache,
  ) {}

  public async getLessonMaterials(
    roomId: string,
    lessonPlanId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<Content>> {
    const cacheKey = `${roomId}|${lessonPlanId}`
    const cacheHit = await this.cache.getLessonPlanMaterials(cacheKey)
    if (cacheHit) {
      return cacheHit
    }

    const dtos = await this.cmsContentApi.getLessonMaterials(
      lessonPlanId,
      authenticationToken,
    )
    const lessonMaterials = dtos.map((x) => contentDtoToEntity(x))
    await this.cache.setLessonPlanMaterials(cacheKey, lessonMaterials)

    return lessonMaterials
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<Content | undefined> {
    const cacheHit = await this.cache.getLessonMaterial(contentId)
    if (cacheHit) {
      return cacheHit
    }

    const dto = await this.cmsContentApi.getLessonMaterial(
      contentId,
      authenticationToken,
    )
    if (!dto) return undefined
    const lessonMaterial = contentDtoToEntity(dto)
    await this.cache.setLessonMaterial(lessonMaterial)

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
