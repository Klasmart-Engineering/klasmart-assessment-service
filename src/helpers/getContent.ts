import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Content } from '../db/cms/entities/content'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import ContentKey from './contentKey'

const logger = withLogger('helpers:getContent')

// TODO: Remove after content_id migration.
export const h5pIdToCmsContentIdCache = new Map<string, string>()

export default async function getContent(
  contentKey: string,
  contentType: string | undefined | null,
  contentName: string | undefined | null,
  contentParentId: string | undefined | null,
  cmsContentProvider: CmsContentProvider,
  authenticationToken?: string,
): Promise<Content | null> {
  logger.debug(`getContent >> contentKey: ${contentKey}`)
  const { contentId, subcontentId } = ContentKey.deconstruct(contentKey)
  let content =
    (await cmsContentProvider.getLessonMaterial(
      contentId,
      authenticationToken,
    )) || null
  if (!content) {
    content = await findCmsContentUsingH5pId(
      cmsContentProvider,
      contentId,
      authenticationToken,
    )
  }

  if (content) {
    const result = new Content(
      content.contentId,
      content.author,
      content.name,
      content.contentType,
      content.createdAt,
      content.data,
      content.publishStatus,
    )
    result.subcontentId = subcontentId
    result.type = contentType
    result.name = contentName ?? content.name
    result.parentId = contentParentId
    return result
  }

  return content
}

// TODO: Remove after content_id migration.
async function findCmsContentUsingH5pId(
  cmsContentProvider: CmsContentProvider,
  h5pId: string,
  authenticationToken?: string,
): Promise<Content | null> {
  const contentId = h5pIdToCmsContentIdCache.get(h5pId)
  if (contentId) {
    return (
      (await cmsContentProvider.getLessonMaterial(
        contentId,
        authenticationToken,
      )) ?? null
    )
  }
  const matchingContents =
    await cmsContentProvider.getLessonMaterialsWithSourceId(
      h5pId,
      authenticationToken,
    )

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
