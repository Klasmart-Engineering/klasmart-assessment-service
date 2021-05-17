import path from 'path'
import express from 'express'
import { createApolloServer } from './createApolloServer'
import 'reflect-metadata'
import { buildFederatedSchema } from './buildFederatedSchema'

const routePrefix = process.env.ROUTE_PREFIX || ''

async function main() {
  const schema = await buildFederatedSchema({
    resolvers: [
      path.join(__dirname, '/resolvers/**/*.ts'),
      path.join(__dirname, '/resolvers/**/*.js'),
    ],
  })

  const server = createApolloServer(schema)

  const app = express()
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
