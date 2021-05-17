import { ApolloGateway } from '@apollo/gateway'
import { ApolloServer } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'

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
        return { ip }
      } catch (e) {
        console.error(e)
      }
    },
  })
}
