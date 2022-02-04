import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { Logger } from 'winston'

import { Context } from '../auth/context'
import { UserScores } from '../graphql'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      UserScoresResolver._logger ||
      (UserScoresResolver._logger = withLogger('UserScoresResolver'))
    )
  }

  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserScores,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    this.Logger.debug(`UserScores { userId: ${source.userId} } >> user`)
    return await this.userProvider.getUser(
      source.userId,
      context.encodedAuthenticationToken,
    )
  }
}
