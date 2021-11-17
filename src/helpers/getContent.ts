import { Content } from '../db/cms/entities/content'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import ContentKey from './contentKey'

// TODO: Remove after content_id migration.
export const h5pIdToCmsContentIdCache = new Map<string, string>()

export async function createH5pIdToCmsContentIdCache(
  cmsContentProvider: CmsContentProvider,
): Promise<void> {
  const materials = await cmsContentProvider.getAllLessonMaterials()

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
  contentParentId: string | undefined | null,
  cmsContentProvider: CmsContentProvider,
): Promise<Content | null> {
  const { contentId, subcontentId } = ContentKey.deconstruct(contentKey)
  let content = (await cmsContentProvider.getLessonMaterial(contentId)) || null
  if (!content) {
    content = await findCmsContentUsingH5pId(cmsContentProvider, contentId)
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
): Promise<Content | null> {
  const contentId = h5pIdToCmsContentIdCache.get(h5pId)
  if (contentId) {
    return (await cmsContentProvider.getLessonMaterial(contentId)) ?? null
  }
  const matchingContents =
    await cmsContentProvider.getLessonMaterialsWithSourceId(h5pId)

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
