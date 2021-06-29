import { getRepository, Repository } from 'typeorm'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { Content } from '../db/cms/entities/content'
import { ContentType } from '../db/cms/enums/contentType'

const h5pIdToCmsContentIdCache = new Map<string, string>()

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
  contentId: string,
  contentType: string | undefined,
  contentName: string | undefined,
  contentRepository: Repository<Content>,
): Promise<Content | null> {
  const ids = contentId.split('|', 2)
  const mainContentId = ids[0]
  const subcontentId = ids.length >= 2 ? ids[1] : undefined
  let content = (await contentRepository.findOne(mainContentId)) || null

  if (!content) {
    const cmsContentId = await findCmsContentIdUsingH5pId(mainContentId)
    if (cmsContentId) {
      content = (await contentRepository.findOne(cmsContentId)) || null
    }
  }

  if (content) {
    content.subcontentId = subcontentId
    content.type = contentType
    content.name = contentName ?? content.name
  }

  return content
}

export async function findCmsContentIdUsingH5pId(
  h5pId: string,
): Promise<string | undefined> {
  let cmsContentId = h5pIdToCmsContentIdCache.get(h5pId)
  if (!cmsContentId) {
    const matchingContents = (await getRepository(Content, CMS_CONNECTION_NAME)
      .createQueryBuilder()
      .where({ contentType: ContentType.LessonMaterial })
      .andWhere(`data->"$.source" = :source`, {
        source: h5pId,
      })
      .select(['id', 'publish_status'])
      .getRawMany()) as {
      id: string
      publish_status: string
    }[]

    if (matchingContents && matchingContents.length > 0) {
      const publishedContent = matchingContents.find(
        (x) => x.publish_status === 'published',
      )
      cmsContentId = publishedContent?.id ?? matchingContents[0].id
      h5pIdToCmsContentIdCache.set(h5pId, cmsContentId)
    }
  }
  return cmsContentId
}
