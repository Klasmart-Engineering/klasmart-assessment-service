import 'reflect-metadata'
import path from 'path'
import express from 'express'
import compression from 'compression'
import { useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'

import { connectToCmsDatabase } from './db/cms/connectToCmsDatabase'
import { connectToUserDatabase } from './db/users/connectToUserDatabase'
import { buildFederatedSchema } from './buildFederatedSchema'
import { createApolloServer } from './createApolloServer'
import { connectToAssessmentDatabase } from './db/assessments/connectToAssessmentDatabase'

const routePrefix = process.env.ROUTE_PREFIX || ''

useContainer(Container)

async function main() {
  // await connectToCmsDatabase()
  await connectToUserDatabase()
  await connectToAssessmentDatabase()

  const schema = await buildFederatedSchema({
    resolvers: [
      path.join(__dirname, './resolvers/**/*.ts'),
      path.join(__dirname, './resolvers/**/*.js'),
    ],
  })

  const server = createApolloServer(schema)

  const app = express()
  app.use(compression())
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
