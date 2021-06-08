import { AuthenticationError } from 'apollo-server-express'
import { AuthChecker } from 'type-graphql'
import { Context } from './resolvers/context'

export const authChecker: AuthChecker<Context> = (
  { context: { userId } },
  roles,
) => {
  return userId !== undefined

  // No roles matched. Restrict access.
  return false
}
