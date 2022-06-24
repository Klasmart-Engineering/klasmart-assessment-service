import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Content } from '../db/cms/entities/content'
import { Benchmark } from '../helpers/benchmarkMiddleware'
import { throwExpression } from '../helpers/throwExpression'
import { CachedCmsContentApi } from '../web/cms/cachedCmsContentApi'
import ContentResponse, {
  ContentDto,
  StudentContentMapEntryDto,
} from '../web/cms/contentResponse'

const logger = withLogger('CmsContentProvider')

@Service()
export class CmsContentProvider {
  constructor(private readonly cmsContentApi: CachedCmsContentApi) {}

  @Benchmark()
  public async getLessonMaterials(
    roomId: string,
    authenticationToken?: string,
  ): Promise<StudentContentsResult> {
    const response = await this.cmsContentApi.getLessonMaterials(
      roomId,
      authenticationToken,
    )
    const studentContentMap = responseToStudentContentsResult(response)

    return studentContentMap
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<Content | undefined> {
    logger.debug(`getLessonMaterial >> contentId: ${contentId}`)

    const dto = await this.cmsContentApi.getLessonMaterial(
      contentId,
      authenticationToken,
    )
    if (!dto) return undefined
    const lessonMaterial = contentDtoToEntity(dto)

    return lessonMaterial
  }
}

function responseToStudentContentsResult(
  response: ContentResponse,
): StudentContentsResult {
  const contents = new Map(
    response.list.map((x) => [x.id as string, contentDtoToCompositeEntity(x)]),
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

function contentDtoToCompositeEntity(dto: ContentDto): CompositeContent {
  const content = contentDtoToEntity(dto)
  return {
    content,
    subContents: [],
  }
}

function contentDtoToEntity(dto: ContentDto): Content {
  return new Content(
    dto.id ?? throwExpression('content.id is undefined'),
    dto.content_name ?? throwExpression('content.content_name is undefined'),
    dto.publish_status ??
      throwExpression('content.publish_status is undefined'),
    JSON.parse(dto.data ?? throwExpression('content.data is undefined')),
  )
}

export type StudentContentMapEntry = {
  studentId: string
  contentIds: ReadonlyArray<string>
}

export type CompositeContent = {
  content: Content
  subContents: Content[]
}

export type StudentContentsResult = {
  contents: ReadonlyMap<string, CompositeContent>
  studentContentMap: ReadonlyArray<StudentContentMapEntry>
}
