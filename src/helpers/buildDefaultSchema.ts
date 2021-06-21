import { GraphQLSchema } from 'graphql'
import path from 'path'
import { buildSchema } from 'type-graphql'
import { Container } from 'typeorm-typedi-extensions'
import { authChecker } from '../auth/authChecker'

export function buildDefaultSchema(): Promise<GraphQLSchema> {
  return buildSchema({
    resolvers: [
      path.join(__dirname, '../resolvers/**/*.ts'),
      path.join(__dirname, '../resolvers/**/*.js'),
    ],
    authChecker,
    container: Container,
    dateScalarMode: 'timestamp',
    emitSchemaFile: {
      path: path.join(__dirname, '../generatedSchema.gql'),
    },
  })
}
