import 'reflect-metadata'
import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'

import { connectToCmsDatabase } from './db/cms/connectToCmsDatabase'
import { connectToUserDatabase } from './db/users/connectToUserDatabase'
import { buildSchema } from 'type-graphql'
import { createApolloServer } from './createApolloServer'
import { connectToAssessmentDatabase } from './db/assessments/connectToAssessmentDatabase'

const routePrefix = process.env.ROUTE_PREFIX || ''

useContainer(Container)

async function main() {
  await connectToCmsDatabase()
  await connectToUserDatabase()
  await connectToAssessmentDatabase()

  const schema = await buildSchema({
    resolvers: [
      path.join(__dirname, './resolvers/**/*.ts'),
      path.join(__dirname, './resolvers/**/*.js'),
    ],
    container: Container,
    dateScalarMode: 'timestamp',
    emitSchemaFile: {
      path: __dirname + '/generatedSchema.gql',
    },
  })

  const server = createApolloServer(schema)

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  server.applyMiddleware({
    app,
    path: routePrefix,
  })

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    console.log(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    )
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
