import { ApolloError } from 'apollo-server-express'
import DataLoader from 'dataloader'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'

import { UserScores } from '../graphql'
import {
  UserDataLoader,
  UserDataLoaderFunc,
  UserProvider,
} from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('UserScoresResolver')

@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  @UserDataLoader()
  public async user(@Root() source: UserScores): Promise<UserDataLoaderFunc> {
    logger.debug(`UserScores { userId: ${source.userId} } >> user`)
    return async (dataloader: DataLoader<string, ApolloError | User>) =>
      dataloader.load(source.userId)
  }
}
