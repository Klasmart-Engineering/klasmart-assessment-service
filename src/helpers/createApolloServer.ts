import {
  ApolloServer,
  AuthenticationError,
  ExpressContext,
} from 'apollo-server-express'
import { GraphQLSchema } from 'graphql'
import { Container } from 'typedi'
import { checkToken } from '../auth/auth'
import { Context } from '../auth/context'
import { PermissionChecker } from '../auth/permissionChecker'
import { UserPermissions } from '../auth/permissions'

export const createApolloServer = (schema: GraphQLSchema): ApolloServer => {
  return new ApolloServer({
    schema,
    formatError: (err) => {
      // Override the @Authorized error by TypeGraphQL.
      if (err.message.startsWith('Access denied!')) {
        return new AuthenticationError('Please authenticate')
      }
      return err
    },
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
        const permissions = new UserPermissions(
          token,
          Container.get(PermissionChecker),
        )
        return { token, ip, userId: token?.id, permissions }
      } catch (e) {
        console.error(e)
        const permissions = new UserPermissions(
          undefined,
          Container.get(PermissionChecker),
        )
        return { permissions }
      }
    },
  })
}
