import { ApolloError } from 'apollo-server-express'
import DataLoader from 'dataloader'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Ctx, FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { Context } from '../auth/context'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import getContent from '../helpers/getContent'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import {
  UserDataLoader,
  UserDataLoaderFunc,
  UserProvider,
} from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('UserContentScoreResolver')

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  constructor(
    private readonly userProvider: UserProvider,
    private readonly cmsContentProvider: CmsContentProvider,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  @UserDataLoader()
  public async user(
    @Root() source: UserContentScore,
  ): Promise<UserDataLoaderFunc> {
    logger.debug(
      `UserContentScore { studentId: ${source.studentId} } >> student`,
    )
    return async (dataloader: DataLoader<string, ApolloError | User>) =>
      dataloader.load(source.studentId)
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: UserContentScore,
    @Ctx() context: Context,
  ): Promise<Content | null> {
    logger.debug(
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
