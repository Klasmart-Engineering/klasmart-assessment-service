import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Ctx, FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { Context } from '../auth/context'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { Benchmark } from '../helpers/benchmarkMiddleware'
import CustomizedContentProvider from '../providers/customizedContentProvider'
import { User } from '../web/user'

const logger = withLogger('UserContentScoreResolver')

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  constructor(private readonly contentProvider: CustomizedContentProvider) {}

  // TODO: Use field in UserContentScore rather than this FieldResolver.
  @FieldResolver(() => User, { nullable: true })
  public user(@Root() source: UserContentScore): User {
    logger.debug(
      `UserContentScore { studentId: ${source.studentId} } >> student`,
    )
    return { userId: source.studentId }
  }

  @Benchmark('UserContentScore')
  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: UserContentScore,
    @Ctx() context: Context,
  ): Promise<Content | null> {
    logger.debug(
      `UserContentScore { contentKey: ${source.contentKey} } >> content`,
    )
    if (source.content) {
      return source.content
    }
    return await this.contentProvider.getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      source.contentParentId,
      context.encodedAuthenticationToken,
    )
  }
}
