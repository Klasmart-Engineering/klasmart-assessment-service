import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { UserScores } from '../graphql'
import { User } from '../web/user'

const logger = withLogger('UserScoresResolver')

// TODO: Consider replacing this field resolver with a normal field in the UserScores class.
@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  @FieldResolver(() => User, { nullable: true })
  public user(@Root() source: UserScores): User {
    logger.debug(`UserScores { userId: ${source.userId} } >> user`)
    return { userId: source.userId }
  }
}
