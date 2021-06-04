import { createParamDecorator } from 'type-graphql'

export interface Context {
  token?: Record<string, unknown>
  ip: string | string[]
  userId?: string
}

export function UserID(): ParameterDecorator {
  return createParamDecorator<Context>(({ context }) => context.userId)
}
