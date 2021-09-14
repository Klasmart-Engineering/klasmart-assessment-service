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
import { connectToXApiDatabase } from './db/xapi/sql/connectToXApiDatabase'
import { buildDefaultSchema } from './helpers/buildDefaultSchema'
import { createH5pIdToCmsContentIdCache } from './helpers/getContent'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { XApiDynamodbRepository } from './db/xapi/dynamodb/repo'
import { TokenDecoder } from './auth/auth'
import { XApiSqlRepository } from './db/xapi/sql/repo'
import { XApiRecordSql } from './db/xapi/sql/entities'

const routePrefix = process.env.ROUTE_PREFIX || ''

useContainer(Container)

async function main() {
  await registerAndConnectToDataSources()
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

async function registerAndConnectToDataSources() {
  const connectionPromises: Promise<void>[] = []

  const cmsDatabaseUrl = process.env.CMS_DATABASE_URL
  if (!cmsDatabaseUrl) {
    throw new Error('Please specify a value for CMS_DATABASE_URL')
  }
  connectionPromises.push(connectToCmsDatabase(cmsDatabaseUrl))

  const userDatabaseUrl = process.env.USER_DATABASE_URL
  if (!userDatabaseUrl) {
    throw new Error('Please specify a value for USER_DATABASE_URL')
  }
  connectionPromises.push(connectToUserDatabase(userDatabaseUrl))

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  connectionPromises.push(connectToAssessmentDatabase(assessmentDatabaseUrl))

  if (process.env.USE_XAPI_SQL_DATABASE_FLAG === '1') {
    const xapiEventsDatabaseUrl = process.env.XAPI_DATABASE_URL
    if (!xapiEventsDatabaseUrl) {
      throw new Error('Please specify a value for XAPI_DATABASE_URL')
    }
    const sqlConnection = await connectToXApiDatabase(xapiEventsDatabaseUrl)
    const repository = sqlConnection.getRepository(XApiRecordSql)
    MutableContainer.set('IXApiRepository', repository)
  } else {
    const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME
    if (!dynamodbTableName) {
      throw new Error(
        `Dynamodb TableName must be set using DYNAMODB_TABLE_NAME environment variable`,
      )
    }
    const docClient = new DocumentClient({
      apiVersion: '2012-08-10',
    })
    MutableContainer.set(
      'IXApiRepository',
      new XApiDynamodbRepository(dynamodbTableName, docClient),
    )
  }

  await Promise.all(connectionPromises)
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
