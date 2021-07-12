import 'reflect-metadata'
import express from 'express'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { useContainer } from 'typeorm'
import { Container as MutableContainer } from 'typedi'
import { Container } from 'typeorm-typedi-extensions'

import { connectToCmsDatabase } from './db/cms/connectToCmsDatabase'
import { connectToUserDatabase } from './db/users/connectToUserDatabase'
import { createApolloServer } from './helpers/createApolloServer'
import { connectToAssessmentDatabase } from './db/assessments/connectToAssessmentDatabase'
import { buildDefaultSchema } from './helpers/buildDefaultSchema'
import { createH5pIdToCmsContentIdCache } from './helpers/getContent'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { XAPIRepository } from './db/xapi/repo'
import { TokenDecoder } from './auth/auth'

const routePrefix = process.env.ROUTE_PREFIX || ''

useContainer(Container)

async function main() {
  registerXAPIRepositoryDependencies()
  await connectToDatabases()
  await createH5pIdToCmsContentIdCache()

  const schema = await buildDefaultSchema()
  const server = createApolloServer(schema, new TokenDecoder())

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

// *** Restrict all environment variable access to be done here at the entry point. ***

function registerXAPIRepositoryDependencies() {
  const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME
  if (!dynamodbTableName) {
    throw new Error(
      `Dynamodb TableName must be set using DYNAMODB_TABLE_NAME environment variable`,
    )
  }
  MutableContainer.set(
    XAPIRepository.DYNAMODB_TABLE_NAME_DI_KEY,
    dynamodbTableName,
  )
  MutableContainer.set(
    XAPIRepository.DYNAMODB_DOC_CLIENT_DI_KEY,
    new DocumentClient({
      apiVersion: '2012-08-10',
    }),
  )
}

async function connectToDatabases() {
  const cmsDatabaseUrl = process.env.CMS_DATABASE_URL
  if (!cmsDatabaseUrl) {
    throw new Error('Please specify a value for CMS_DATABASE_URL')
  }
  await connectToCmsDatabase(cmsDatabaseUrl)

  const userDatabaseUrl = process.env.USER_DATABASE_URL
  if (!userDatabaseUrl) {
    throw new Error('Please specify a value for USER_DATABASE_URL')
  }
  await connectToUserDatabase(userDatabaseUrl)

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  await connectToAssessmentDatabase(assessmentDatabaseUrl)
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
