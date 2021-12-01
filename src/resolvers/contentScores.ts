import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { Content } from '../db/cms/entities'
import getContent from '../helpers/getContent'
import { ContentScores } from '../graphql/scoresByContent'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import { Context } from '../auth/context'

@Service()
@Resolver(() => ContentScores)
export default class ContentScoresResolver {
  constructor(private readonly cmsContentProvider: CmsContentProvider) {}

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: ContentScores,
    @Ctx() context: Context,
  ): Promise<Content | null> {
    return await getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      source.parentId,
      this.cmsContentProvider,
      context.encodedAuthenticationToken,
    )
  }
}
