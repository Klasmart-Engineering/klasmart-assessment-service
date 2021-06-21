import { createParamDecorator } from 'type-graphql'
import { UserPermissions } from './permissions'
import { IToken } from './auth'

export interface Context {
  token?: IToken
  ip?: string | string[]
  userId?: string
  permissions: UserPermissions
}

export function UserID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.userId)
}
