import { ApolloError } from 'apollo-server-express'
import DataLoader from 'dataloader'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Container, Service } from 'typedi'
import { Loader } from 'type-graphql-dataloader'

import { UserApi, User, BatchedQueryUser } from '../web/user'

const logger = withLogger('UserProvider')

export type UserDataLoaderFunc = (
  dataloader: DataLoader<string, ApolloError | User>,
) => Promise<User | ApolloError>

export const UserDataLoader = () =>
  Loader<string, ApolloError | User>(async (userIds, { context }) => {
    const userProvider = Container.get(UserProvider)
    const userResults = await userProvider.dataloader(
      userIds,
      context.encodedAuthenticationToken,
    )
    return userResults
  })

@Service()
export class UserProvider {
  public constructor(private readonly userApi: UserApi) {}

  public async getUser(
    userId: string,
    authorizationToken?: string,
  ): Promise<User | undefined> {
    const user = await this.userApi.fetchUser(userId, authorizationToken)
    return user
  }

  public async dataloader(
    userIds: ReadonlyArray<string>,
    authorizationToken?: string,
  ): Promise<(ApolloError | User)[]> {
    logger.debug(`dataloader >> user_ids: ${userIds}`)
    // batchLoadFn
    const userResultsMap = await this.userApi.batchFetchUsers(
      userIds,
      authorizationToken,
    )

    const userResults = userIds.map((userId) => {
      const result = userResultsMap.get(userId)
      if (result === undefined) {
        return new ApolloError(
          `Error while trying to fetch User with id ${userId}`,
        )
      }
      const { data, errors } = result
      if (errors || data === undefined) {
        if (errors === undefined || errors?.length <= 0) {
          return new ApolloError(
            `Error while trying to fetch User with id ${userId}`,
          )
        }
        // get the first error (there's typically only one)
        // TODO: combine all errors into one since we have to return a single error instance
        const err = errors[0]
        return new ApolloError(
          `Couldn't fetch User with id ${userId}. User-Serivce Error: ${err.message}`,
          err.extensions?.code,
          { ...(err.extensions || {}) },
        )
      }
      return data.user
    })
    logger.debug(`dataloader ==> userResults count: ${userResults.length}`)
    return userResults
  }
}
