import 'reflect-metadata'
import express from 'express'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { useContainer } from 'typeorm'
import { Container } from 'typeorm-typedi-extensions'

import { connectToCmsDatabase } from './db/cms/connectToCmsDatabase'
import { connectToUserDatabase } from './db/users/connectToUserDatabase'
import { createApolloServer } from './helpers/createApolloServer'
import { connectToAssessmentDatabase } from './db/assessments/connectToAssessmentDatabase'
import { buildDefaultSchema } from './helpers/buildDefaultSchema'
import { createH5pIdToCmsContentIdCache } from './helpers/getContent'

const routePrefix = process.env.ROUTE_PREFIX || ''

useContainer(Container)

async function main() {
  await connectToCmsDatabase()
  await connectToUserDatabase()
  await connectToAssessmentDatabase()

  await createH5pIdToCmsContentIdCache()

  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema)

  const app = express()
  app.use(compression())
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ limit: '1mb', extended: true }))
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
