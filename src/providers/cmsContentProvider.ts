import { throwExpression } from '../helpers/throwExpression'
import { Content } from '../db/cms/entities/content'
import { CmsContentApi } from '../web/cmsContentApi'
import { ContentDto } from '../web/contentResponse'
import { Service } from 'typedi'

@Service()
export class CmsContentProvider {
  constructor(private readonly cmsContentApi: CmsContentApi) {}

  public async getLessonMaterials(lessonPlanId: string): Promise<Content[]> {
    const dtos = await this.cmsContentApi.getLessonMaterials(lessonPlanId)
    const lessonMaterials = dtos.map((x) => contentDtoToEntity(x))

    return lessonMaterials
  }

  public async getAllLessonMaterials(): Promise<Content[]> {
    const dtos = await this.cmsContentApi.getAllLessonMaterials()
    const lessonMaterials = dtos.map((x) => contentDtoToEntity(x))

    return lessonMaterials
  }

  public async getLessonMaterial(
    contentId: string,
  ): Promise<Content | undefined> {
    const dto = await this.cmsContentApi.getLessonMaterial(contentId)
    if (!dto) return undefined
    const lessonMaterial = contentDtoToEntity(dto)

    return lessonMaterial
  }

  public async getLessonMaterialsWithSourceId(
    sourceId: string,
  ): Promise<Content[]> {
    const dtos = await this.cmsContentApi.getLessonMaterialsWithSourceId(
      sourceId,
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
