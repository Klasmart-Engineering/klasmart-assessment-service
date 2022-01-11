import { Configuration } from '../../src/initialization/configuration'
import expect from '../utils/chaiAsPromisedSetup'

describe('configuration', function () {
  context(
    `USE_XAPI_SQL_DATABASE_FLAG is defined but XAPI_DATABASE_URL isn't`,
    () => {
      let useXapiSqlDatabaseFlag: string | undefined
      let xapiDatabaseUrl: string | undefined

      before(() => {
        useXapiSqlDatabaseFlag = process.env.USE_XAPI_SQL_DATABASE_FLAG
        xapiDatabaseUrl = process.env.XAPI_DATABASE_URL
        process.env.USE_XAPI_SQL_DATABASE_FLAG = '1'
        delete process.env.XAPI_DATABASE_URL
      })

      after(() => {
        resetEnvironmentVariable(
          'USE_XAPI_SQL_DATABASE_FLAG',
          useXapiSqlDatabaseFlag,
        )
        resetEnvironmentVariable('XAPI_DATABASE_URL', xapiDatabaseUrl)
      })

      it('throws configuration error', async () => {
        // Act
        const fn = () => new Configuration()

        // Assert
        expect(fn).to.throw(
          '❌ When USE_XAPI_SQL_DATABASE_FLAG=1 you must provide XAPI_DATABASE_URL',
        )
      })
    },
  )

  context(
    `USE_XAPI_SQL_DATABASE_FLAG is undefined, AWS_REGION is undefined`,
    () => {
      let useXapiSqlDatabaseFlag: string | undefined
      let awsRegion: string | undefined
      let dynamoDbTableName: string | undefined

      before(() => {
        useXapiSqlDatabaseFlag = process.env.USE_XAPI_SQL_DATABASE_FLAG
        awsRegion = process.env.AWS_REGION
        dynamoDbTableName = process.env.DYNAMODB_TABLE_NAME
        delete process.env.USE_XAPI_SQL_DATABASE_FLAG
        delete process.env.AWS_REGION
        process.env.DYNAMODB_TABLE_NAME = 'my-db-name'
      })

      after(() => {
        resetEnvironmentVariable(
          'USE_XAPI_SQL_DATABASE_FLAG',
          useXapiSqlDatabaseFlag,
        )
        resetEnvironmentVariable('AWS_REGION', awsRegion)
        resetEnvironmentVariable('DYNAMODB_TABLE_NAME', dynamoDbTableName)
      })

      it('throws configuration error', async () => {
        // Act
        const fn = () => new Configuration()

        // Assert
        expect(fn).to.throw(
          '❌ When USE_XAPI_SQL_DATABASE_FLAG=0 you must provide DYNAMODB_TABLE_NAME and AWS_REGION',
        )
      })
    },
  )

  context(
    `USE_XAPI_SQL_DATABASE_FLAG is undefined, DYNAMODB_TABLE_NAME is undefined`,
    () => {
      let useXapiSqlDatabaseFlag: string | undefined
      let awsRegion: string | undefined
      let dynamoDbTableName: string | undefined

      before(() => {
        useXapiSqlDatabaseFlag = process.env.USE_XAPI_SQL_DATABASE_FLAG
        awsRegion = process.env.AWS_REGION
        dynamoDbTableName = process.env.DYNAMODB_TABLE_NAME
        delete process.env.USE_XAPI_SQL_DATABASE_FLAG
        process.env.AWS_REGION = 'ap-northeast-2'
        delete process.env.DYNAMODB_TABLE_NAME
      })

      after(() => {
        resetEnvironmentVariable(
          'USE_XAPI_SQL_DATABASE_FLAG',
          useXapiSqlDatabaseFlag,
        )
        resetEnvironmentVariable('AWS_REGION', awsRegion)
        resetEnvironmentVariable('DYNAMODB_TABLE_NAME', dynamoDbTableName)
      })

      it('throws configuration error', async () => {
        // Act
        const fn = () => new Configuration()

        // Assert
        expect(fn).to.throw(
          '❌ When USE_XAPI_SQL_DATABASE_FLAG=0 you must provide DYNAMODB_TABLE_NAME and AWS_REGION',
        )
      })
    },
  )

  context(
    `both USE_ATTENDANCE_API_FLAG and ATTENDANCE_DATABASE_URL are undefined`,
    () => {
      let useAttendanceApiFlag: string | undefined
      let attendanceDatabaseUrl: string | undefined

      before(() => {
        useAttendanceApiFlag = process.env.USE_ATTENDANCE_API_FLAG
        attendanceDatabaseUrl = process.env.ATTENDANCE_DATABASE_URL
        delete process.env.USE_ATTENDANCE_API_FLAG
        delete process.env.ATTENDANCE_DATABASE_URL
      })

      after(() => {
        resetEnvironmentVariable(
          'USE_ATTENDANCE_API_FLAG',
          useAttendanceApiFlag,
        )
        resetEnvironmentVariable(
          'ATTENDANCE_DATABASE_URL',
          attendanceDatabaseUrl,
        )
      })

      it('throws configuration error', async () => {
        // Act
        const fn = () => new Configuration()

        // Assert
        expect(fn).to.throw(
          '❌ When USE_ATTENDANCE_API_FLAG=0 you must provide ATTENDANCE_DATABASE_URL',
        )
      })
    },
  )

  const requiredEnvironmentVariables = [
    'DOMAIN',
    'CMS_API_URL',
    'USER_SERVICE_ENDPOINT',
    'ASSESSMENT_DATABASE_URL',
  ]
  requiredEnvironmentVariables.forEach((envVar) => {
    context(`DOMAIN is undefined`, () => {
      let originalValue: string | undefined

      before(() => {
        originalValue = process.env[envVar]
        delete process.env[envVar]
      })

      after(() => {
        resetEnvironmentVariable(envVar, originalValue)
      })

      it('throws configuration error', async () => {
        // Act
        const fn = () => new Configuration()

        // Assert
        expect(fn).to.throw(
          `❌ Environment variable '${envVar}' needs to be defined`,
        )
      })
    })
  })
})

function resetEnvironmentVariable(
  envVar: string,
  originalValue: string | undefined,
) {
  if (originalValue == undefined) {
    delete process.env[envVar]
  } else {
    process.env[envVar] = originalValue
  }
}
