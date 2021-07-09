import { AuthChecker } from 'type-graphql'
import { Context } from './context'

export const authChecker: AuthChecker<Context> = async (
  { context: { userId } },
  roles,
) => {
  return userId !== undefined
}
