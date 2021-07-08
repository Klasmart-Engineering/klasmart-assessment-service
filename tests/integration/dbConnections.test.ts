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
import { ILogger, Logger } from '../../src/helpers/logger'

describe('connectToAssessmentDatabase', () => {
  it('synchronize is true, dropSchema is undefined', async () => {
    const port = Number(process.env.TEST_POSTGRES_PORT) || 5442
    const url = `postgres://postgres:assessments@localhost:${port}/test_assessment_db`
    const config = getAssessmentDatabaseConnectionOptions(url)
    expect(config.synchronize).is.true
    expect(config.dropSchema).is.undefined
  })

  it('connects successfully', async () => {
    const port = Number(process.env.TEST_POSTGRES_PORT) || 5442
    const url = `postgres://postgres:assessments@localhost:${port}/test_assessment_db`
    await connectToAssessmentDatabase(url)
    await getConnection(ASSESSMENTS_CONNECTION_NAME).close()
  })

  context('invalid url (wrong username)', () => {
    it('logs connection error and rethrows', async () => {
      const logger = Substitute.for<ILogger>()
      Logger.register(() => logger)
      const port = Number(process.env.TEST_POSTGRES_PORT) || 5442
      const url = `postgres://postgre:assessments@localhost:${port}/test_assessment_db`
      const fn = () => connectToAssessmentDatabase(url)
      await expect(fn()).to.be.rejected
      logger.received(1).error(Arg.any())
    })
  })
})

describe('connectToUserDatabase', () => {
  it('synchronize is false, dropSchema is undefined', async () => {
    const port = Number(process.env.TEST_POSTGRES_PORT) || 5442
    const url = `postgres://postgres:assessments@localhost:${port}/test_user_db`
    const config = getUserDatabaseConnectionOptions(url)
    expect(config.synchronize).is.false
    expect(config.dropSchema).is.undefined
  })

  it('connects successfully', async () => {
    const port = Number(process.env.TEST_POSTGRES_PORT) || 5442
    const url = `postgres://postgres:assessments@localhost:${port}/test_user_db`
    await connectToUserDatabase(url)
    await getConnection(USERS_CONNECTION_NAME).close()
  })

  context('invalid url (wrong username)', () => {
    it('logs connection error and rethrows', async () => {
      const logger = Substitute.for<ILogger>()
      Logger.register(() => logger)
      const port = Number(process.env.TEST_POSTGRES_PORT) || 5442
      const url = `postgres://postgre:assessments@localhost:${port}/test_user_db`
      const fn = () => connectToUserDatabase(url)
      await expect(fn()).to.be.rejected
      logger.received(1).error(Arg.any())
    })
  })
})

describe('connectToCmsDatabase', () => {
  it('synchronize is false, dropSchema is undefined', async () => {
    const port = Number(process.env.TEST_MYSQL_PORT) || 3316
    const url = `mysql://root:assessments@localhost:${port}/test_cms_db`
    const config = getCmsDatabaseConnectionOptions(url)
    expect(config.synchronize).is.false
    expect(config.dropSchema).is.undefined
  })

  it('connects successfully', async () => {
    const port = Number(process.env.TEST_MYSQL_PORT) || 3316
    const url = `mysql://root:assessments@localhost:${port}/test_cms_db`
    await connectToCmsDatabase(url)
    await getConnection(CMS_CONNECTION_NAME).close()
  })

  context('invalid url (wrong username)', () => {
    it('logs connection error and rethrows', async () => {
      const logger = Substitute.for<ILogger>()
      Logger.register(() => logger)
      const port = Number(process.env.TEST_MYSQL_PORT) || 3316
      const url = `mysql://roo:assessments@localhost:${port}/test_cms_db`
      const fn = () => connectToCmsDatabase(url)
      await expect(fn()).to.be.rejected
      logger.received(1).error(Arg.any())
    })
  })
})
