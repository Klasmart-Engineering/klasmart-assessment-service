import { ApolloGateway } from '@apollo/gateway'
import { ApolloServer } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Context } from './resolvers/context'

export const createApolloServer = (
  schema?: GraphQLSchema,
  gateway?: ApolloGateway,
): ApolloServer => {
  return new ApolloServer({
    gateway,
    schema,
    context: async ({ req, connection }) => {
      try {
        if (connection) {
          return connection.context
        }
        const ip = req.headers['x-forwarded-for'] || req.ip
        const user_id = "teacherId"
        const context: Context = {
          ip,
          user_id,
        }
        return context
      } catch (e) {
        console.error(e)
      }
    },
  })
}
