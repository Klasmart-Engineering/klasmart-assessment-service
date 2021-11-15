import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { getConnection } from 'typeorm'
import {
  ASSESSMENTS_CONNECTION_NAME,
  connectToAssessmentDatabase,
  getAssessmentDatabaseConnectionOptions,
} from '../../src/db/assessments/connectToAssessmentDatabase'
import {
  CMS_CONNECTION_NAME,
  connectToCmsDatabase,
  getCmsDatabaseConnectionOptions,
} from '../../src/db/cms/connectToCmsDatabase'
import {
  connectToUserDatabase,
  getUserDatabaseConnectionOptions,
  USERS_CONNECTION_NAME,
} from '../../src/db/users/connectToUserDatabase'
import {
  connectToXApiDatabase,
  getXApiDatabaseConnectionOptions,
  XAPI_CONNECTION_NAME,
} from '../../src/db/xapi/sql/connectToXApiDatabase'
import { ILogger, Logger } from '../../src/helpers/logger'

describe('connectToDatabases', () => {
  const host = process.env.LOCALHOST || 'localhost'
  const postgresDbPort = Number(process.env.TEST_POSTGRES_PORT) || 5442
  const asessmentDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_assessment_db`
  const userDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_user_db`
  const xapiSqlDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_xapi_db`
  const mysqlPort = Number(process.env.TEST_MYSQL_PORT) || 3316
  const mysqlUrl = `mysql://root:assessments@${host}:${mysqlPort}/test_cms_db`
  //console.log({ asessmentDbUrl, userDbUrl, mysqlUrl, xapiSqlDbUrl })

  before(() => Logger.reset())
  after(() => {
    Logger.reset()
    Logger.register(() => Substitute.for<ILogger>())
  })
  afterEach(() => Logger.reset())

  describe('connectToAssessmentDatabase', () => {
    it('synchronize is true, dropSchema is undefined, runMigrations is false', async () => {
      const config = getAssessmentDatabaseConnectionOptions(asessmentDbUrl)
      expect(config.synchronize).is.true
      expect(config.dropSchema).is.undefined
      expect(config.migrationsRun).is.false
    })

    it('connects successfully', async () => {
      await connectToAssessmentDatabase(asessmentDbUrl)
      await getConnection(ASSESSMENTS_CONNECTION_NAME).close()
    })

    context('invalid url (wrong username)', () => {
      it('logs connection error and rethrows', async () => {
        const logger = Substitute.for<ILogger>()
        Logger.register(() => logger)
        const badUrl = `postgres://xxxxxxx:assessments@${host}:${postgresDbPort}/test_assessment_db`
        const fn = () => connectToAssessmentDatabase(badUrl)
        await expect(fn()).to.be.rejected
        logger.received(1).error(Arg.any())
      })
    })
  })

  describe('connectToXApiSqlDatabase', () => {
    it('synchronize is false, dropSchema is undefined', async () => {
      const config = getXApiDatabaseConnectionOptions(xapiSqlDbUrl)
      expect(config.synchronize).is.false
      expect(config.dropSchema).is.undefined
    })

    it('connects successfully', async () => {
      await connectToXApiDatabase(xapiSqlDbUrl)
      await getConnection(XAPI_CONNECTION_NAME).close()
    })

    context('invalid url (wrong username)', () => {
      it('logs connection error and rethrows', async () => {
        const logger = Substitute.for<ILogger>()
        Logger.register(() => logger)
        const badUrl = `postgres://xxxxxxx:assessments@${host}:${postgresDbPort}/test_xapi_db`
        const fn = () => connectToXApiDatabase(badUrl)
        await expect(fn()).to.be.rejected
        logger.received(1).error(Arg.any())
      })
    })
  })

  describe('connectToUserDatabase', () => {
    it('synchronize is false, dropSchema is undefined', async () => {
      const config = getUserDatabaseConnectionOptions(userDbUrl)
      expect(config.synchronize).is.false
      expect(config.dropSchema).is.undefined
    })

    it('connects successfully', async () => {
      await connectToUserDatabase(userDbUrl)
      await getConnection(USERS_CONNECTION_NAME).close()
    })

    context('invalid url (wrong username)', () => {
      it('logs connection error and rethrows', async () => {
        const logger = Substitute.for<ILogger>()
        Logger.register(() => logger)
        const badUrl = `postgres://xxxxxxx:assessments@${host}:${postgresDbPort}/test_user_db`
        const fn = () => connectToUserDatabase(badUrl)
        await expect(fn()).to.be.rejected
        logger.received(1).error(Arg.any())
      })
    })
  })

  describe('connectToCmsDatabase', () => {
    it('synchronize is false, dropSchema is undefined', async () => {
      const config = getCmsDatabaseConnectionOptions(mysqlUrl)
      expect(config.synchronize).is.false
      expect(config.dropSchema).is.undefined
    })

    it('connects successfully', async () => {
      await connectToCmsDatabase(mysqlUrl)
      await getConnection(CMS_CONNECTION_NAME).close()
    })

    context('invalid url (wrong username)', () => {
      it('logs connection error and rethrows', async () => {
        const logger = Substitute.for<ILogger>()
        Logger.register(() => logger)
        const badUrl = `mysql://xxxxx:assessments@${host}:${mysqlPort}/test_cms_db`
        const fn = () => connectToCmsDatabase(badUrl)
        await expect(fn()).to.be.rejected
        logger.received(1).error(Arg.any())
      })
    })
  })
})
