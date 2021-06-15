import { createParamDecorator } from 'type-graphql'
import { UserPermissions } from '../permissions'

export interface Context {
  token?: Record<string, unknown>
  ip?: string | string[]
  userId?: string
  permissions?: UserPermissions
}

export function UserID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.userId)
}
