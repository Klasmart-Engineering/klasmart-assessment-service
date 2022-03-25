import { withLogger } from 'kidsloop-nodejs-logger'
import { Inject, Service } from 'typedi'
import { ICache } from '../cache/interface'
import { Content } from '../db/cms/entities/content'
import { throwExpression } from '../helpers/throwExpression'
import DiKeys from '../initialization/diKeys'
import { CmsContentApi, ContentDto } from '../web/cms'
import ContentResponse, {
  StudentContentMapEntryDto,
} from '../web/cms/contentResponse'

const logger = withLogger('CmsContentProvider')

@Service()
export class CmsContentProvider {
  constructor(
    private readonly cmsContentApi: CmsContentApi,
    @Inject(DiKeys.ICache)
    public readonly cache: ICache,
  ) {}

  public async getLessonMaterials(
    roomId: string,
    authenticationToken?: string,
  ): Promise<StudentContentsResult> {
    const response = await this.cmsContentApi.getLessonMaterials(
      roomId,
      authenticationToken,
    )
    const studentContentMap = responseToStudentContentsResult(response)
    await this.cache.setLessonPlanMaterials([
      ...studentContentMap.contents.values(),
    ])

    return studentContentMap
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<Content | undefined> {
    logger.debug(`getLessonMaterial >> contentId: ${contentId}`)

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
    logger.debug(`getLessonMaterialsWithSourceId >> sourceId: ${sourceId}`)

    const dtos = await this.cmsContentApi.getLessonMaterialsWithSourceId(
      sourceId,
      authenticationToken,
    )
    const lessonMaterials = dtos.map((x) => contentDtoToEntity(x))

    return lessonMaterials
  }
}

function responseToStudentContentsResult(
  response: ContentResponse,
): StudentContentsResult {
  const contents = new Map(
    response.list.map((x) => [x.id as string, contentDtoToEntity(x)]),
  )
  const studentContentMap =
    response.student_content_map?.map(studentContentMapEntryDtoToEntity) ?? []
  return {
    contents,
    studentContentMap,
  }
}

function studentContentMapEntryDtoToEntity(
  dto: StudentContentMapEntryDto,
): StudentContentMapEntry {
  return {
    studentId:
      dto.student_id ?? throwExpression('student.student_id is undefined'),
    contentIds: dto.content_ids,
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

export type StudentContentMapEntry = {
  studentId: string
  contentIds: ReadonlyArray<string>
}

export type StudentContentsResult = {
  contents: ReadonlyMap<string, Content>
  studentContentMap: ReadonlyArray<StudentContentMapEntry>
}
