import newrelicApolloServerPlugin from '@newrelic/apollo-server-plugin'
import {
  ApolloServer,
  AuthenticationError,
  ExpressContext,
} from 'apollo-server-express'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core'
import { GraphQLSchema } from 'graphql'
import { ApolloServerLoaderPlugin } from 'type-graphql-dataloader'
import { getConnection } from 'typeorm'
import { checkAuthenticationToken } from '@kl-engineering/kidsloop-token-validation'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Context } from '../auth/context'
import { ErrorMessage } from '../helpers/errorMessages'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'

const logger = withLogger('createApolloServer')
const isDevelopment = process.env.NODE_ENV === 'development'

export const createApolloServer = (schema: GraphQLSchema): ApolloServer => {
  return new ApolloServer({
    schema,
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
      isDevelopment
        ? ApolloServerPluginLandingPageGraphQLPlayground({
            settings: {
              'request.credentials': 'include',
              'schema.polling.interval': 60 * 1000,
            },
          })
        : ApolloServerPluginLandingPageDisabled(),
      ApolloServerLoaderPlugin({
        typeormGetConnection: () => getConnection(ASSESSMENTS_CONNECTION_NAME),
      }),
      // Note: New Relic plugin should always be listed last
      newrelicApolloServerPlugin,
    ],
  })
}
