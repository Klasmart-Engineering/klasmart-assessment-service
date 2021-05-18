import 'reflect-metadata'
import path from 'path'
import express from 'express'
import compression from 'compression'

import { buildFederatedSchema } from './buildFederatedSchema'
import { connectToDatabase } from './connectToDatabase'
import { createApolloServer } from './createApolloServer'

const routePrefix = process.env.ROUTE_PREFIX || ''

async function main() {
  await connectToDatabase()

  const schema = await buildFederatedSchema({
    resolvers: [
      path.join(__dirname, '/resolvers/**/*.ts'),
      path.join(__dirname, '/resolvers/**/*.js'),
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
