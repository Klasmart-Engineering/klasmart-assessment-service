import { Connection, createConnection } from 'typeorm'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
import { USERS_CONNECTION_NAME } from '../../src/db/users/connectToUserDatabase'

export const createBootstrapPostgresConnection = (): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5434,
    username: 'postgres',
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
    port: 5434,
    username: 'postgres',
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
    port: 5434,
    username: 'postgres',
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
    port: 3308,
    username: 'root',
    database: 'test_cms_db',
    synchronize: true,
    dropSchema: true,
    entities: ['src/db/cms/entities/*.ts'],
  })
}
