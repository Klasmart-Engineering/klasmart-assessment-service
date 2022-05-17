import { createParamDecorator } from 'type-graphql'
import { KidsloopAuthenticationToken } from '@kl-engineering/kidsloop-token-validation'

export interface Context {
  authenticationToken?: KidsloopAuthenticationToken
  encodedAuthenticationToken?: string
  ip?: string | string[]
  userId?: string
}

export function UserID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.userId)
}
