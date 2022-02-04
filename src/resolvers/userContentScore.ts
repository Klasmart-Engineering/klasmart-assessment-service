import { withLogger } from 'kidsloop-nodejs-logger'
import { Ctx, FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Logger } from 'winston'

import { Context } from '../auth/context'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import getContent from '../helpers/getContent'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      UserContentScoreResolver._logger ||
      (UserContentScoreResolver._logger = withLogger(
        'UserContentScoreResolver',
      ))
    )
  }

  constructor(
    private readonly userProvider: UserProvider,
    private readonly cmsContentProvider: CmsContentProvider,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserContentScore,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    this.Logger.debug(
      `UserContentScore { studentId: ${source.studentId} } >> student`,
    )
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: UserContentScore,
    @Ctx() context: Context,
  ): Promise<Content | null> {
    this.Logger.debug(
      `UserContentScore { contentKey: ${source.contentKey} } >> content`,
    )
    return await getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      source.contentParentId,
      this.cmsContentProvider,
      context.encodedAuthenticationToken,
    )
  }
}
