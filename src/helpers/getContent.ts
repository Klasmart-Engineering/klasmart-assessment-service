import { getRepository, Repository } from 'typeorm'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { Content } from '../db/cms/entities/content'
import { ContentType } from '../db/cms/enums/contentType'
import ContentKey from './contentKey'

export const h5pIdToCmsContentIdCache = new Map<string, string>()

export async function createH5pIdToCmsContentIdCache(): Promise<void> {
  const materials = await getRepository(Content, CMS_CONNECTION_NAME)
    .createQueryBuilder()
    .where({ contentType: ContentType.LessonMaterial })
    .getMany()

  for (const x of materials) {
    if (!x.h5pId) continue
    const cmsContentId = h5pIdToCmsContentIdCache.get(x.h5pId)
    if (!cmsContentId || x.publishStatus === 'published') {
      h5pIdToCmsContentIdCache.set(x.h5pId, x.contentId)
    }
  }
}

export default async function getContent(
  contentKey: string,
  contentType: string | undefined | null,
  contentName: string | undefined | null,
  contentRepository: Repository<Content>,
): Promise<Content | null> {
  const { contentId, subcontentId } = ContentKey.deconstruct(contentKey)
  let content = (await contentRepository.findOne(contentId)) || null
  if (!content) {
    content = await findCmsContentUsingH5pId(contentRepository, contentId)
  }

  if (content) {
    content.subcontentId = subcontentId
    content.type = contentType
    content.name = contentName ?? content.name
  }

  return content
}

async function findCmsContentUsingH5pId(
  contentRepository: Repository<Content>,
  h5pId: string,
): Promise<Content | null> {
  const contentId = h5pIdToCmsContentIdCache.get(h5pId)
  if (contentId) {
    return (await contentRepository.findOne(contentId)) ?? null
  }
  const matchingContents = await contentRepository
    .createQueryBuilder()
    .where({ contentType: ContentType.LessonMaterial })
    .andWhere(`data->"$.source" = :source`, {
      source: h5pId,
    })
    .getMany()

  if (matchingContents && matchingContents.length > 0) {
    const publishedContent = matchingContents.find(
      (x) => x.publishStatus === 'published',
    )
    const content = publishedContent ?? matchingContents[0]
    h5pIdToCmsContentIdCache.set(h5pId, content.contentId)
    return content
  }
  return null
}
