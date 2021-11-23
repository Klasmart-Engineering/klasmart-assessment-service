import newrelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import {
  ApolloServer,
  AuthenticationError,
  ExpressContext,
} from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { checkAuthenticationToken } from 'kidsloop-token-validation'
import { Context } from '../auth/context'
import { ErrorMessage } from './errorMessages'
import { Logger } from './logger'

export const createApolloServer = (schema: GraphQLSchema): ApolloServer => {
  return new ApolloServer({
    schema,
    playground: {
      settings: {
        'request.credentials': 'include',
      },
    },
    introspection: true,
    formatError: (err) => {
      // Override the @Authorized error by TypeGraphQL.
      if (err.message.startsWith('Access denied!')) {
        return new AuthenticationError(ErrorMessage.notAuthenticated)
      }
      return err
    },
    context: async ({ req }: ExpressContext): Promise<Context | undefined> => {
      try {
        const ip = (req.headers['x-forwarded-for'] || req.ip) as string
        const encodedAuthenticationToken =
          req.headers.authorization || req.cookies.access
        const authenticationToken = await checkAuthenticationToken(
          encodedAuthenticationToken,
        )
        return {
          authenticationToken,
          encodedAuthenticationToken,
          ip,
          userId: authenticationToken?.id,
        }
      } catch (e: unknown) {
        Logger.get().error(e as string)
      }
    },
    plugins: [
      // Note: New Relic plugin should always be listed last
      newrelicApolloServerPlugin,
    ],
  })
}
