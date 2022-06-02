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
  public readonly CMS_API_URL: string
  public readonly H5P_API_URL: string
  // caching
  public readonly REDIS_HOST?: string = process.env.REDIS_HOST
  public readonly REDIS_PORT?: string = process.env.REDIS_PORT
  public readonly REDIS_MODE?: string = process.env.REDIS_MODE
  // storage
  public readonly ASSESSMENT_DATABASE_URL: string
  // docs
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
    this.H5P_API_URL = getEnvironmentVariableOrThrow('H5P_API_URL')
    this.ASSESSMENT_DATABASE_URL = getEnvironmentVariableOrThrow(
      'ASSESSMENT_DATABASE_URL',
    )

    logger.info('🚩 Flags:')
    logger.info(`- ENABLE_PAGE_DOCS: ${this.ENABLE_PAGE_DOCS}`)
    logger.info('🗺️  APIs:')
    logger.info(`- CMS_API_URL: ${this.CMS_API_URL}`)
    logger.info(`- H5P_API_URL: ${this.H5P_API_URL}`)
    logger.info('📘 Storage:')
    logger.info(`- REDIS_HOST is set: ${Boolean(this.REDIS_HOST)}`)
    logger.info(`- REDIS_PORT is set: ${Boolean(this.REDIS_PORT)}`)
    logger.info(`- REDIS_MODE is set: ${this.REDIS_MODE}`)
    logger.info('-----------------')
  }
}

let config: Configuration

export const getConfig = (): Configuration => {
  if (!config) {
    config = new Configuration()
  }
  return config
}
