import { createParamDecorator } from 'type-graphql'
import { IToken } from './auth'

export interface Context {
  token?: IToken
  ip?: string | string[]
  userId?: string
}

export function UserID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.userId)
}
