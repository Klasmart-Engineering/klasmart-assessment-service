import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { checkToken } from './auth'
import { Context } from './resolvers/context'

export const createApolloServer = (schema?: GraphQLSchema): ApolloServer => {
  return new ApolloServer({
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
