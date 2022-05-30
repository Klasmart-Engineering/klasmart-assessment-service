import { expect } from 'chai'
import { getConnection } from 'typeorm'
import { connectToIoRedis } from '../../src/cache/redis'
import {
  ASSESSMENTS_CONNECTION_NAME,
  connectToAssessmentDatabase,
  getAssessmentDatabaseConnectionOptions,
} from '../../src/db/assessments/connectToAssessmentDatabase'

describe('connectToDatabases', () => {
  const host = process.env.LOCALHOST || 'localhost'
  const postgresDbPort = Number(process.env.TEST_POSTGRES_PORT) || 5432
  const asessmentDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_assessment_db`
  const redisMode = 'NODE'
  const redisHost = host
  const redisPort = 6379

  describe('connectToAssessmentDatabase', () => {
    it('synchronize is false, dropSchema is undefined, runMigrations is true', async () => {
      const config = getAssessmentDatabaseConnectionOptions(asessmentDbUrl)
      expect(config.synchronize).is.false
      expect(config.dropSchema).is.undefined
      expect(config.migrationsRun).is.true
    })

    // TODO: Throws an error: "QueryFailedError: column 'timestamp' does not exist"
    // when run together with the other tests. Just need to drop the existing db
    // before running this test, but we'll address it after refatoring the tests.
    it.skip('connects successfully', async () => {
      await connectToAssessmentDatabase(asessmentDbUrl)
      await getConnection(ASSESSMENTS_CONNECTION_NAME).close()
    })

    context('invalid url (wrong username)', () => {
      it('rethrows', async () => {
        const badUrl = `postgres://xxxxxxx:assessments@${host}:${postgresDbPort}/test_assessment_db`
        const fn = () => connectToAssessmentDatabase(badUrl)
        await expect(fn()).to.be.rejected
      })
    })
  })

  describe('connectToRedis', () => {
    it('connects successfully', async () => {
      const redisClient = await connectToIoRedis(
        redisMode,
        redisHost,
        redisPort,
      )
      await redisClient.quit()
    })

    context('invalid url (wrong port)', () => {
      it('rethrows', async () => {
        const badPort = 1111
        const fn = async () =>
          await connectToIoRedis(redisMode, redisHost, badPort)
        await expect(fn()).to.be.rejected
      })
    })
  })
})
