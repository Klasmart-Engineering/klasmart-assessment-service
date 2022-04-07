import path from 'path'
import { Connection, createConnection } from 'typeorm'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import { ATTENDANCE_CONNECTION_NAME } from '../../src/db/attendance/connectToAttendanceDatabase'
import { XAPI_CONNECTION_NAME } from '../../src/db/xapi/sql/connectToXApiDatabase'

export const createBootstrapPostgresConnection = (): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    host: process.env.LOCALHOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
  })
}

export const createTestConnections = (): Promise<Connection>[] => {
  return [createAssessmentDbConnection(), createAttendanceDbConnection()]
}

export const createAssessmentDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: ASSESSMENTS_CONNECTION_NAME,
    type: 'postgres',
    host: process.env.LOCALHOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
    database: 'test_assessment_db',
    synchronize: false,
    migrations: [path.join(__dirname, '../../src/migrations/*.ts')],
    migrationsTableName: 'assessment_xapi_migration',
    migrationsRun: true,
    dropSchema: true,
    entities: ['src/db/assessments/entities/*.ts'],
    logging: true,
  })
}

export const createAttendanceDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: ATTENDANCE_CONNECTION_NAME,
    type: 'postgres',
    host: process.env.LOCALHOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
    database: 'test_attendance_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/db/users/entities/*.ts'],
  })
}

export const createXApiDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: XAPI_CONNECTION_NAME,
    type: 'postgres',
    host: process.env.LOCALHOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
    database: 'test_xapi_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/db/xapi/sql/entities/*.ts'],
  })
}
