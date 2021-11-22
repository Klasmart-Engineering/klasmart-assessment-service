import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'

import { User } from '../api/user'
import { Context } from '../auth/context'
import { UserScores } from '../graphql'
import { UserProvider } from '../helpers/userProvider'

@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserScores,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.userId,
      context.encodedAuthenticationToken,
    )
  }
}
