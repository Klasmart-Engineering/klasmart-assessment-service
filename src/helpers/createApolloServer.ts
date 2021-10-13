import newrelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import {
  ApolloServer,
  AuthenticationError,
  ExpressContext,
} from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { checkToken, TokenDecoder } from '../auth/auth'
import { Context } from '../auth/context'
import { ErrorMessage } from './errorMessages'
import { Logger } from './logger'

export const createApolloServer = (
  schema: GraphQLSchema,
  tokenDecoder: TokenDecoder,
): ApolloServer => {
  return new ApolloServer({
    schema,
    playground: true,
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
        const encodedToken = req.headers.authorization || req.cookies.access
        const token = await checkToken(encodedToken, tokenDecoder)
        return { token, ip, userId: token?.id }
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
