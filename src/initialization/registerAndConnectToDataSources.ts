import { Container as MutableContainer } from 'typedi'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { withLogger } from 'kidsloop-nodejs-logger'

import {
  connectToRedisCache,
  RedisCache,
  InMemoryCache,
  ICache,
} from '../cache'
import { connectToAttendanceDatabase } from '../db/attendance/connectToAttendanceDatabase'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { connectToXApiDatabase } from '../db/xapi/sql/connectToXApiDatabase'
import { XApiDynamodbRepository } from '../db/xapi/dynamodb/repo'
import { XApiSqlRepository } from '../db/xapi/sql/repo'
import { XApiRecordSql } from '../db/xapi/sql/entities'
import {
  RoomAttendanceApiProvider,
  RoomAttendanceDbProvider,
} from '../providers/roomAttendanceProvider'
import { Attendance as AttendanceSql } from '../db/attendance/entities'
import { getConfig } from './configuration'
import { AttendanceApi } from '../web/attendance'
// import { CmsContentProvider } from '../providers/cmsContentProvider'
import DiKeys from './diKeys'

useContainer(TypeormTypediContainer)
const logger = withLogger('registerAndConnectToDataSources')

// *** Restrict all environment variable access to be done here at the entry point. ***
export default async function registerAndConnectToDataSources(): Promise<void> {
  const config = getConfig()

  const connectionPromises: Promise<any>[] = []

  if (config.USE_ATTENDANCE_API_FLAG) {
    const api = new AttendanceApi()
    MutableContainer.set(
      'RoomAttendanceProvider',
      new RoomAttendanceApiProvider(api),
    )
  } else {
    const attendanceDatabaseUrl = config.ATTENDANCE_DATABASE_URL
    if (!attendanceDatabaseUrl) {
      throw new Error('Please specify a value for ATTENDANCE_DATABASE_URL')
    }
    const conn = await connectToAttendanceDatabase(attendanceDatabaseUrl)
    const sqlRepository = conn.getRepository(AttendanceSql)
    MutableContainer.set(
      'RoomAttendanceProvider',
      new RoomAttendanceDbProvider(sqlRepository),
    )
  }

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  connectionPromises.push(connectToAssessmentDatabase(assessmentDatabaseUrl))

  if (process.env.USE_XAPI_SQL_DATABASE_FLAG === '1') {
    logger.info('CONFIG: Using Postgres as XApi storage solution')
    const xapiEventsDatabaseUrl = process.env.XAPI_DATABASE_URL
    if (!xapiEventsDatabaseUrl) {
      throw new Error('Please specify a value for XAPI_DATABASE_URL')
    }
    const conn = await connectToXApiDatabase(xapiEventsDatabaseUrl)
    const sqlRepository = conn.getRepository(XApiRecordSql)
    MutableContainer.set(
      DiKeys.IXApiRepository,
      new XApiSqlRepository(sqlRepository),
    )
  } else {
    logger.info('CONFIG: Using DynamoDB as XApi storage solution')
    const dynamodbTableName = process.env.DYNAMODB_TABLE_NAME
    if (!dynamodbTableName) {
      throw new Error(
        `Dynamodb TableName must be set using DYNAMODB_TABLE_NAME environment variable`,
      )
    }
    const dynamoDbClient = new DynamoDBClient({
      apiVersion: '2012-08-10',
    })
    const xapiDynamodbRepo = new XApiDynamodbRepository(
      dynamodbTableName,
      dynamoDbClient,
    )
    MutableContainer.set(DiKeys.IXApiRepository, xapiDynamodbRepo)
    connectionPromises.push(xapiDynamodbRepo.checkTableIsActive())
  }

  let cache: ICache
  if (config.REDIS_URL) {
    logger.info('CONFIG: Using Redis as Caching solution')
    const redisClient = await connectToRedisCache(config.REDIS_URL)
    cache = new RedisCache(redisClient)
  } else {
    logger.info('CONFIG: Using InMemory as Caching solution')
    cache = new InMemoryCache()
  }
  MutableContainer.set(DiKeys.ICache, cache)
  cache.setRecurringFlush(24 * 60 * 60 * 1000)

  MutableContainer.set(DiKeys.CmsApiUrl, config.CMS_API_URL)
  // const cmsContentProvider = MutableContainer.get(CmsContentProvider)

  await Promise.all(connectionPromises)
}
