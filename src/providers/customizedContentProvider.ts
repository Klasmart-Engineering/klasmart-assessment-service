import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Content } from '../db/cms/entities/content'
import { CmsContentProvider } from './cmsContentProvider'
import ContentKey from '../helpers/contentKey'

const logger = withLogger('ContentProvider')

@Service()
export default class CustomizedContentProvider {
  constructor(private readonly cmsContentProvider: CmsContentProvider) {}

  public async getContent(
    contentKey: string,
    contentType: string | undefined | null,
    contentName: string | undefined | null,
    contentParentId: string | undefined | null,
    authenticationToken?: string,
  ): Promise<Content | null> {
    logger.debug(`getContent >> contentKey: ${contentKey}`)
    const { contentId, subcontentId } = ContentKey.deconstruct(contentKey)
    const content =
      (await this.cmsContentProvider.getLessonMaterial(
        contentId,
        authenticationToken,
      )) || null

    if (content) {
      const result = Content.clone(content)
      result.subcontentId = subcontentId
      result.type = contentType ?? undefined
      result.name = contentName ?? content.name
      result.parentId = contentParentId
      return result
    }

    return content
  }
}
