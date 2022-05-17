import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('configuration')

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
  const value = process.env[name]
  if (!value) {
    throw new BadEnvironmentVariable(name, value)
  }
  return value || ''
}

const getEnrivonmentBooleanFlag = (
  name: string,
  defaultValue = false,
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
  // General
  public readonly DOMAIN: string
  public readonly ROUTE_PREFIX: string
  // API endpoints
  public readonly ATTENDANCE_SERVICE_ENDPOINT?: string =
    process.env.ATTENDANCE_SERVICE_ENDPOINT
  public readonly CMS_API_URL: string
  public readonly USER_SERVICE_ENDPOINT: string
  //caching
  public readonly REDIS_URL?: string = process.env.REDIS_URL
  // storage
  public readonly ASSESSMENT_DATABASE_URL: string
  public readonly ATTENDANCE_DATABASE_URL?: string =
    process.env.ATTENDANCE_DATABASE_URL || process.env.USER_DATABASE_URL
  // Xapi Storage
  public readonly DYNAMODB_TABLE_NAME?: string = process.env.DYNAMODB_TABLE_NAME
  public readonly AWS_REGION?: string = process.env.AWS_REGION
  public readonly XAPI_DATABASE_URL?: string = process.env.XAPI_DATABASE_URL
  // flags
  public readonly USE_ATTENDANCE_API_FLAG: boolean = getEnrivonmentBooleanFlag(
    'USE_ATTENDANCE_API_FLAG',
  )
  public readonly USE_XAPI_SQL_DATABASE_FLAG: boolean =
    getEnrivonmentBooleanFlag('USE_XAPI_SQL_DATABASE_FLAG')
  public readonly ENABLE_PAGE_DOCS: boolean =
    getEnrivonmentBooleanFlag('ENABLE_PAGE_DOCS')

  constructor() {
    logger.info('')
    logger.info('🔧 CONFIGURATION:')
    logger.info('-----------------')
    logger.info(`- NODE_ENV: ${process.env.NODE_ENV}`)
    this.DOMAIN = getEnvironmentVariableOrThrow('DOMAIN')
    logger.info(`- DOMAIN: ${this.DOMAIN}`)
    const routePrefix = process.env.ROUTE_PREFIX || ''
    this.ROUTE_PREFIX = routePrefix.endsWith('/')
      ? routePrefix.slice(0, -1)
      : routePrefix
    logger.info(`- ROUTE_PREFIX: ${this.ROUTE_PREFIX}`)
    this.CMS_API_URL = getEnvironmentVariableOrThrow('CMS_API_URL')
    this.USER_SERVICE_ENDPOINT = getEnvironmentVariableOrThrow(
      'USER_SERVICE_ENDPOINT',
    )
    this.ASSESSMENT_DATABASE_URL = getEnvironmentVariableOrThrow(
      'ASSESSMENT_DATABASE_URL',
    )

    this.checkXapiStorageConfig()
    this.checkAttendanceConfig()

    logger.info('🚩 Flags:')
    logger.info(`- USE_ATTENDANCE_API_FLAG: ${this.USE_ATTENDANCE_API_FLAG}`)
    logger.info(
      `- USE_XAPI_SQL_DATABASE_FLAG: ${this.USE_XAPI_SQL_DATABASE_FLAG}`,
    )
    logger.info(`- ENABLE_PAGE_DOCS: ${this.ENABLE_PAGE_DOCS}`)
    logger.info('🗺️  APIs:')
    logger.info(
      `- ATTENDANCE_SERVICE_ENDPOINT: ${this.ATTENDANCE_SERVICE_ENDPOINT}`,
    )
    logger.info(`- CMS_API_URL: ${this.CMS_API_URL}`)
    logger.info(`- USER_SERVICE_ENDPOINT: ${this.USER_SERVICE_ENDPOINT}`)
    logger.info('📘 Storage:')
    logger.info(`- DYNAMODB_TABLE_NAME: ${this.DYNAMODB_TABLE_NAME}`)
    logger.info(`- REDIS_URL is set: ${Boolean(this.REDIS_URL)}`)
    logger.info('-----------------')
  }

  checkXapiStorageConfig(): void {
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
  }

  checkAttendanceConfig(): void {
    if (this.USE_ATTENDANCE_API_FLAG && !this.ATTENDANCE_SERVICE_ENDPOINT) {
      throw new BadConfiguration(
        '❌ When USE_ATTENDANCE_API_FLAG=1 you must provide ATTENDANCE_SERVICE_ENDPOINT',
      )
    } else if (!this.USE_ATTENDANCE_API_FLAG && !this.ATTENDANCE_DATABASE_URL) {
      throw new BadConfiguration(
        '❌ When USE_ATTENDANCE_API_FLAG=0 you must provide ATTENDANCE_DATABASE_URL',
      )
    }
  }
}

let config: Configuration

export const getConfig = (): Configuration => {
  if (!config) {
    config = new Configuration()
  }
  return config
}
