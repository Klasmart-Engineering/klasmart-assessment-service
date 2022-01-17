import { expect } from 'chai'
import { getConnection } from 'typeorm'
import { connectToRedisCache } from '../../src/cache/redis'
import {
  ASSESSMENTS_CONNECTION_NAME,
  connectToAssessmentDatabase,
  getAssessmentDatabaseConnectionOptions,
} from '../../src/db/assessments/connectToAssessmentDatabase'
import {
  connectToAttendanceDatabase,
  getAttendanceDatabaseConnectionOptions,
  ATTENDANCE_CONNECTION_NAME,
} from '../../src/db/attendance/connectToAttendanceDatabase'
import {
  connectToXApiDatabase,
  getXApiDatabaseConnectionOptions,
  XAPI_CONNECTION_NAME,
} from '../../src/db/xapi/sql/connectToXApiDatabase'

describe('connectToDatabases', () => {
  const host = process.env.LOCALHOST || 'localhost'
  const postgresDbPort = Number(process.env.TEST_POSTGRES_PORT) || 5442
  const asessmentDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_assessment_db`
  const attendanceDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_attendance_db`
  const xapiSqlDbUrl = `postgres://postgres:assessments@${host}:${postgresDbPort}/test_xapi_db`
  const redisUrl = `redis://${host}:6379`

  describe('connectToAssessmentDatabase', () => {
    it('synchronize is false, dropSchema is undefined, runMigrations is true', async () => {
      const config = getAssessmentDatabaseConnectionOptions(asessmentDbUrl)
      expect(config.synchronize).is.false
      expect(config.dropSchema).is.undefined
      expect(config.migrationsRun).is.true
    })

    it('connects successfully', async () => {
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
      it('rethrows', async () => {
        const badUrl = `postgres://xxxxxxx:assessments@${host}:${postgresDbPort}/test_xapi_db`
        const fn = () => connectToXApiDatabase(badUrl)
        await expect(fn()).to.be.rejected
      })
    })
  })

  describe('connectToAttendanceDatabase', () => {
    it('synchronize is false, dropSchema is undefined', async () => {
      const config = getAttendanceDatabaseConnectionOptions(attendanceDbUrl)
      expect(config.synchronize).is.false
      expect(config.dropSchema).is.undefined
    })

    it('connects successfully', async () => {
      await connectToAttendanceDatabase(attendanceDbUrl)
      await getConnection(ATTENDANCE_CONNECTION_NAME).close()
    })

    context('invalid url (wrong username)', () => {
      it('rethrows', async () => {
        const badUrl = `postgres://xxxxxxx:assessments@${host}:${postgresDbPort}/test_attendance_db`
        const fn = () => connectToAttendanceDatabase(badUrl)
        await expect(fn()).to.be.rejected
      })
    })
  })

  describe('connectToRedis', () => {
    it('connects successfully', async () => {
      const redisClient = await connectToRedisCache(redisUrl)
      await redisClient.quit()
    })

    context('invalid url (wrong port)', () => {
      it('rethrows', async () => {
        const badUrl = `redis://${host}:1111`
        const fn = () => connectToRedisCache(badUrl)
        await expect(fn()).to.be.rejected
      })
    })
  })
})
