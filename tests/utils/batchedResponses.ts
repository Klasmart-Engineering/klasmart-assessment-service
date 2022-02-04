import { ApolloError } from 'apollo-server-core'
import { BatchedQueryUser, User } from '../../src/web/user'

type InputWithErrors = {
  user: User
  error: ApolloError
}

export const generateBatchFetchUserRepsonse = (
  values: (User | InputWithErrors)[],
): Map<string, BatchedQueryUser> => {
  const keyValueList: [string, BatchedQueryUser][] = values.map((value) => {
    if ((<InputWithErrors>value).error) {
      const rv = <InputWithErrors>value
      return [
        rv.user.userId,
        {
          data: undefined,
          errors: [rv.error],
        },
      ]
    } else {
      const user = <User>value
      return [
        user.userId,
        {
          data: {
            user,
          },
          errors: undefined,
        },
      ]
    }
  })
  const response = new Map<string, BatchedQueryUser>(keyValueList)
  return response
}
