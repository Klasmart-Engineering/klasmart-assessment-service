import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { UserScores } from '../graphql'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('UserScoresResolver')

@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public user(@Root() source: UserScores): User {
    logger.debug(`UserScores { userId: ${source.userId} } >> user`)
    return { userId: source.userId }
  }
}
