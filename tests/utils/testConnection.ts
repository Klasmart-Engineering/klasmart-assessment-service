import { Connection, createConnection } from 'typeorm'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
import { USERS_CONNECTION_NAME } from '../../src/db/users/connectToUserDatabase'

export const createBootstrapPostgresConnection = (): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    host: 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
  })
}

export const createTestConnections = (): Promise<Connection>[] => {
  return [
    createAssessmentDbConnection(),
    createUserDbConnection(),
    createCmsDbConnection(),
  ]
}

export const createAssessmentDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: ASSESSMENTS_CONNECTION_NAME,
    type: 'postgres',
    host: 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
    database: 'test_assessment_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/db/assessments/entities/*.ts'],
  })
}

export const createUserDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: USERS_CONNECTION_NAME,
    type: 'postgres',
    host: 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5442,
    username: 'postgres',
    password: 'assessments',
    database: 'test_user_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/db/users/entities/*.ts'],
  })
}

export const createCmsDbConnection = (): Promise<Connection> => {
  return createConnection({
    name: CMS_CONNECTION_NAME,
    type: 'mysql',
    host: 'localhost',
    port: Number(process.env.TEST_MYSQL_PORT) || 3316,
    username: 'root',
    password: 'assessments',
    database: 'test_cms_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/db/cms/entities/*.ts'],
  })
}
