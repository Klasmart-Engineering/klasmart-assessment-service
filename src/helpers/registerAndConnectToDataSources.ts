import { Container as MutableContainer } from 'typedi'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { connectToAttendanceDatabase } from '../db/attendance/connectToAttendanceDatabase'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { connectToXApiDatabase } from '../db/xapi/sql/connectToXApiDatabase'
import { XApiDynamodbRepository } from '../db/xapi/dynamodb/repo'
import { XApiSqlRepository } from '../db/xapi/sql/repo'
import { XApiRecordSql } from '../db/xapi/sql/entities'
import {
  RoomAttendanceApiProvider,
  RoomAttendanceDbProvider,
} from './roomAttendanceProvider'
import { Attendance as AttendanceSql } from '../db/attendance/entities'
import { getConfig, Configuration } from './configuration'
import { AttendanceApi } from '../api'

useContainer(TypeormTypediContainer)

// *** Restrict all environment variable access to be done here at the entry point. ***
export default async function registerAndConnectToDataSources(): Promise<void> {
  const config = getConfig()

  const connectionPromises: Promise<void>[] = []

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
    console.log('CONFIG: Using Postgres as XApi storage solution')
    const xapiEventsDatabaseUrl = process.env.XAPI_DATABASE_URL
    if (!xapiEventsDatabaseUrl) {
      throw new Error('Please specify a value for XAPI_DATABASE_URL')
    }
    const conn = await connectToXApiDatabase(xapiEventsDatabaseUrl)
    const sqlRepository = conn.getRepository(XApiRecordSql)
    MutableContainer.set(
      'IXApiRepository',
      new XApiSqlRepository(sqlRepository),
    )
  } else {
    console.log('CONFIG: Using DynamoDB as XApi storage solution')
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
