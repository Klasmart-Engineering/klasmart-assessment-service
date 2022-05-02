import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

import { connectToAssessmentDatabase } from './db/assessments/connectToAssessmentDatabase'
import { RedisStreams } from './streams/redisApi'
import { RedisMode, connectToIoRedis } from './cache/redis'
import { simpleConsumerGroupWorker } from './streams/simpleConsumerGroupWorker'

useContainer(TypeormTypediContainer)

const logger = withLogger('worker')

const main = async () => {
  logger.info('⏳ Starting Assessment Worker')

  const redisMode = (process.env.REDIS_MODE || 'NODE').toUpperCase()
  const redisPort = Number(process.env.REDIS_PORT) || 6379
  const redisHost = process.env.REDIS_HOST
  const stream = process.env.REDIS_STREAM || 'xapi:events'
  const errorStream = process.env.REDIS_ERROR_STREAM || 'xapi:events:error'

  const redisConfiguredCorrectly =
    redisHost &&
    redisPort &&
    ['NODE', 'CLUSTER'].includes(redisMode) &&
    stream &&
    errorStream

  if (!redisConfiguredCorrectly) {
    throw new Error(
      'To configure Redis please specify REDIS_HOST, REDIS_PORT, ' +
        'REDIS_MODE, REDIS_STREAM and REDIS_ERROR_STREAM environment variables',
    )
  }
  const redisClient = await connectToIoRedis(
    redisMode as RedisMode,
    redisHost,
    redisPort,
  )
  const xClient = new RedisStreams(redisClient)
  const group = process.env.REDIS_CONSUMER_GROUP || 'assessment-worker'
  const consumer = process.env.REDIS_CONSUMER || 'worker-0'

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  await connectToAssessmentDatabase(assessmentDatabaseUrl)

  try {
    await xClient.createGroup(stream, group)
  } catch (e) {
    logger.error(
      `Error while trying to create a new Consumer Group ${group} for stream ${stream}`,
      e,
    )
  }

  // infinite process
  logger.info('🌭 Assessment Worker ready to consume xapi events')
  logger.info(`Stream: ${stream}`)
  logger.info(`Error stream: ${errorStream}`)
  logger.info(`Consumer Group: ${group}`)
  logger.info(`Consumer: ${consumer}`)
  logger.info(`Retry when failed: ${true}`)
  simpleConsumerGroupWorker(xClient, stream, errorStream, group, consumer, {
    minEvents: 0,
    maxDelays: 1,
    retryWhenFailed: true,
  })
}

main()
  .then(() => {
    logger.debug('success')
  })
  .catch((err) => {
    console.error(err)
  })
