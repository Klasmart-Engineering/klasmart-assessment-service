import { ApolloGateway } from '@apollo/gateway'
import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { checkToken } from './auth'
import { Context } from './resolvers/context'

export const createApolloServer = (
  schema?: GraphQLSchema,
  gateway?: ApolloGateway,
): ApolloServer => {
  return new ApolloServer({
    gateway,
    schema,
    context: async ({
      req,
      connection,
    }: ExpressContext): Promise<Context | undefined> => {
      try {
        if (connection) {
          return connection.context
        }
        const ip = (req.headers['x-forwarded-for'] || req.ip) as string
        const encodedToken = req.headers.authorization || req.cookies?.access
        const token = await checkToken(encodedToken)
        return { token, ip, userId: token?.id }
      } catch (e) {
        console.error(e)
      }
    },
  })
}
