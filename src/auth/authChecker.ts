import { AuthChecker } from 'type-graphql'
import { Context } from './context'

export const authChecker: AuthChecker<Context> = async (
  { context: { userId } },
  roles,
) => {
  // TODO: Maybe check user db (more strict).
  return userId !== undefined
}
