import path from 'path'
import { Connection, createConnection } from 'typeorm'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export const createBootstrapPostgresConnection = (): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    host: process.env.LOCALHOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5432,
    username: 'postgres',
    password: 'assessments',
  })
}

export const createTestConnections = (): Promise<Connection>[] => {
  return [createAssessmentDbConnection()]
}

export const createAssessmentDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: ASSESSMENTS_CONNECTION_NAME,
    type: 'postgres',
    host: process.env.LOCALHOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5432,
    username: 'postgres',
    password: 'assessments',
    database: 'test_assessment_db',
    synchronize: false,
    migrations: [path.join(__dirname, '../../src/migrations/*.ts')],
    migrationsTableName: 'assessment_xapi_migration',
    migrationsRun: true,
    dropSchema: true,
    entities: ['src/db/assessments/entities/*.ts'],
    logging: false,
  })
}
