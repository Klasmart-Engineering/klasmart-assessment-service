import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'

import { Context } from '../auth/context'
import { UserScores } from '../graphql'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('UserScoresResolver')

@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserScores,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    logger.debug(`UserScores { userId: ${source.userId} } >> user`)
    return await this.userProvider.getUser(
      source.userId,
      context.encodedAuthenticationToken,
    )
  }
}
