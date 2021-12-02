import newrelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import {
  ApolloServer,
  AuthenticationError,
  ExpressContext,
} from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { checkAuthenticationToken } from 'kidsloop-token-validation'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Context } from '../auth/context'
import { ErrorMessage } from '../helpers/errorMessages'

const logger = withLogger('createApolloServer')

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
        if (e instanceof Error) {
          logger.error(e.stack)
        } else {
          logger.error(e)
        }
      }
    },
    plugins: [
      // Note: New Relic plugin should always be listed last
      newrelicApolloServerPlugin,
    ],
  })
}
