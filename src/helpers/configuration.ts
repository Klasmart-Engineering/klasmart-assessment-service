import { Logger } from '../helpers/logger'

const logger = Logger.get()

class BadEnvironmentVariable<T> extends Error {
  constructor(variableName: string, value: T) {
    const message =
      value === undefined
        ? `❌ Environment variable '${variableName}' needs to be defined`
        : `❌ Environment variable '${variableName}' set to '${value}' is not set correctly`
    logger.error(message)
    super(message)
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BadEnvironmentVariable.prototype)
  }
}

class BadConfiguration extends Error {
  constructor(message: string) {
    logger.error(message)
    super(message)
    Object.setPrototypeOf(this, BadConfiguration.prototype)
  }
}

const getEnvironmentVariableOrThrow = (name: string): string => {
  const attendanceServiceEnpoint = process.env[name]
  if (!attendanceServiceEnpoint && !(process.env.NODE_ENV === 'test')) {
    throw new BadEnvironmentVariable(name, attendanceServiceEnpoint)
  }
  return attendanceServiceEnpoint || ''
}

const getEnrivonmentBooleanFlag = (
  name: string,
  defaultValue: boolean = false,
): boolean => {
  if (
    process.env[name] === '1' ||
    process.env[name]?.toLowerCase() === 'true'
  ) {
    return true
  }
  if (
    process.env[name] === '0' ||
    process.env[name]?.toLowerCase() === 'false'
  ) {
    return false
  }
  return defaultValue
}

export class Configuration {
  public readonly ATTENDANCE_SERVICE_ENDPOINT: string
  public readonly USER_SERVICE_ENDPOINT: string
  public readonly ASSESSMENT_DATABASE_URL: string
  // Xapi Storage
  public readonly DYNAMODB_TABLE_NAME?: string = process.env.DYNAMODB_TABLE_NAME
  public readonly AWS_REGION?: string = process.env.AWS_REGION
  public readonly XAPI_DATABASE_URL?: string = process.env.XAPI_DATABASE_URL
  public readonly USE_XAPI_SQL_DATABASE_FLAG: boolean =
    getEnrivonmentBooleanFlag('USE_XAPI_SQL_DATABASE_FLAG')

  constructor() {
    logger.info('')
    logger.info('🔧 CONFIGURATION:')
    logger.info('-----------------')
    this.ATTENDANCE_SERVICE_ENDPOINT =
      process.env.ATTENDANCE_SERVICE_ENDPOINT || ''
    this.USER_SERVICE_ENDPOINT = getEnvironmentVariableOrThrow(
      'USER_SERVICE_ENDPOINT',
    )
    this.ASSESSMENT_DATABASE_URL = getEnvironmentVariableOrThrow(
      'ASSESSMENT_DATABASE_URL',
    )
    if (this.USE_XAPI_SQL_DATABASE_FLAG && !this.XAPI_DATABASE_URL) {
      throw new BadConfiguration(
        '❌ When USE_XAPI_SQL_DATABASE_FLAG=1 you must provide XAPI_DATABASE_URL',
      )
    } else if (
      !this.USE_XAPI_SQL_DATABASE_FLAG &&
      (!this.AWS_REGION || !this.DYNAMODB_TABLE_NAME)
    ) {
      throw new BadConfiguration(
        '❌ When USE_XAPI_SQL_DATABASE_FLAG=0 you must provide DYNAMODB_TABLE_NAME and AWS_REGION',
      )
    }
    logger.info(
      `ATTENDANCE_SERVICE_ENDPOINT: ${this.ATTENDANCE_SERVICE_ENDPOINT}`,
    )
    logger.info(`USER_SERVICE_ENDPOINT: ${this.USER_SERVICE_ENDPOINT}`)
    logger.info(`ASSESSMENT_DATABASE_URL: ${this.ASSESSMENT_DATABASE_URL}`)
    logger.info(`DYNAMODB_TABLE_NAME: ${this.DYNAMODB_TABLE_NAME}`)
    logger.info(`AWS_REGION: ${this.AWS_REGION}`)
    logger.info(`XAPI_DATABASE_URL: ${this.XAPI_DATABASE_URL}`)
    logger.info(
      `USE_XAPI_SQL_DATABASE_FLAG: ${this.USE_XAPI_SQL_DATABASE_FLAG}`,
    )
    logger.info('-----------------')
  }
}

export const config = new Configuration()

export const getConfig = (): Configuration => config
