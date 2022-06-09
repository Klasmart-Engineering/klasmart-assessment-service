import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Content } from '../db/cms/entities'
import ContentProvider from '../helpers/getContent'
import { ContentScores } from '../graphql/scoresByContent'
import { Context } from '../auth/context'

const logger = withLogger('ContentScoresResolver')

@Service()
@Resolver(() => ContentScores)
export default class ContentScoresResolver {
  constructor(private readonly contentProvider: ContentProvider) {}

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: ContentScores,
    @Ctx() context: Context,
  ): Promise<Content | null> {
    logger.debug(
      `ContentScores { contentKey: ${source.contentKey} } >> content`,
    )
    const userContentScore = source.scores[0]
    if (userContentScore.content) {
      return userContentScore.content
    }
    return await this.contentProvider.getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      source.parentId,
      context.encodedAuthenticationToken,
    )
  }
}
