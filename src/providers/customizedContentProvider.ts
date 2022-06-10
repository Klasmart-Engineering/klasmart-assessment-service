import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Content } from '../db/cms/entities/content'
import { CmsContentProvider } from './cmsContentProvider'
import ContentKey from '../helpers/contentKey'

const logger = withLogger('ContentProvider')

@Service()
export default class CustomizedContentProvider {
  constructor(
    private readonly cmsContentProvider: CmsContentProvider,
    private readonly h5pIdToCmsContentIdCache = new Map<string, string>(),
  ) {}

  public async getContent(
    contentKey: string,
    contentType: string | undefined | null,
    contentName: string | undefined | null,
    contentParentId: string | undefined | null,
    authenticationToken?: string,
  ): Promise<Content | null> {
    logger.debug(`getContent >> contentKey: ${contentKey}`)
    const { contentId, subcontentId } = ContentKey.deconstruct(contentKey)
    let content: Content | null = null
    if (this.h5pIdToCmsContentIdCache.has(contentId)) {
      content = await this.findCmsContentUsingH5pId(
        this.cmsContentProvider,
        contentId,
        authenticationToken,
      )
    } else {
      content =
        (await this.cmsContentProvider.getLessonMaterial(
          contentId,
          authenticationToken,
        )) || null
      if (!content) {
        content = await this.findCmsContentUsingH5pId(
          this.cmsContentProvider,
          contentId,
          authenticationToken,
        )
      }
    }

    if (content) {
      const result = Content.clone(content)
      result.subcontentId = subcontentId
      result.type = contentType
      result.name = contentName ?? content.name
      result.parentId = contentParentId
      return result
    }

    return content
  }

  private async findCmsContentUsingH5pId(
    cmsContentProvider: CmsContentProvider,
    h5pId: string,
    authenticationToken?: string,
  ): Promise<Content | null> {
    const contentId = this.h5pIdToCmsContentIdCache.get(h5pId)
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
      this.h5pIdToCmsContentIdCache.set(h5pId, content.contentId)
      return content
    }
    return null
  }
}
