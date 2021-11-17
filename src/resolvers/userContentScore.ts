import { Ctx, FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { User } from '../api/user'
import { UserProvider } from '../helpers/userProvider'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import getContent from '../helpers/getContent'
import { Context } from '../auth/context'
import { CmsContentProvider } from '../providers/cmsContentProvider'

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  constructor(
    private readonly userProvider: UserProvider,
    private readonly cmsContentProvider: CmsContentProvider,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserContentScore,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: UserContentScore,
  ): Promise<Content | null> {
    return await getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      source.contentParentId,
      this.cmsContentProvider,
    )
  }
}
