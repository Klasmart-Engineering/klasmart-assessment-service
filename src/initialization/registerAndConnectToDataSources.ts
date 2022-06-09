import { Container as MutableContainer } from 'typedi'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import {
  RedisCache,
  InMemoryCache,
  ICache,
  connectToIoRedis,
  RedisMode,
} from '../cache'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { getConfig } from './configuration'
import DiKeys from './diKeys'

useContainer(TypeormTypediContainer)
const logger = withLogger('registerAndConnectToDataSources')

// *** Restrict all environment variable access to be done here at the entry point. ***
export default async function registerAndConnectToDataSources(): Promise<void> {
  const config = getConfig()

  const connectionPromises: Promise<any>[] = []

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  console.log('assessmentDatabaseUrl ===>', assessmentDatabaseUrl)
  connectionPromises.push(connectToAssessmentDatabase(assessmentDatabaseUrl))

  let cache: ICache
  const redisMode = (process.env.REDIS_MODE || 'NODE').toUpperCase()
  const redisPort = Number(process.env.REDIS_PORT) || 6379
  const redisHost = process.env.REDIS_HOST
  const redisConfiguredCorrectly =
    redisHost && redisPort && ['NODE', 'CLUSTER'].includes(redisMode)

  if (redisConfiguredCorrectly) {
    logger.info('CONFIG: Using Redis as Caching solution')
    const redisClient = await connectToIoRedis(
      redisMode as RedisMode,
      redisHost,
      redisPort,
    )
    cache = new RedisCache(redisClient)
  } else {
    logger.info(
      'CONFIG: To configure Redis please specify REDIS_HOST, REDIS_PORT and' +
        ' REDIS_MODE  environment variables',
    )
    cache = new InMemoryCache()
  }
  MutableContainer.set(DiKeys.CmsApiUrl, config.CMS_API_URL)
  MutableContainer.set(DiKeys.H5pUrl, config.H5P_API_URL)
  MutableContainer.set(DiKeys.ICache, cache)
  cache.setRecurringFlush(24 * 60 * 60 * 1000)

  await Promise.all(connectionPromises)
}
