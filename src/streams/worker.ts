import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

// import { connectToRedisCache } from '../cache/redis'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { RedisMode, RedisStreams, connectToIoRedis } from './redisApi'
import { STREAM_NAME, GROUP_NAME } from './index'
import { simpleConsumerGroupWorker } from './simpleConsumerGroupWorker'

useContainer(TypeormTypediContainer)

const logger = withLogger('worker')

const main = async () => {
  logger.info('⏳ Starting Assessment Worker')

  const redisMode = (process.env.REDIS_MODE || 'NODE').toUpperCase()
  const redisPort = Number(process.env.REDIS_PORT) || 6379
  const redisHost = process.env.REDIS_HOST
  const redisStreamName = process.env.REDIS_STREAM_NAME || 'xapi:events'

  const redisConfiguredCorrectly =
    redisHost &&
    redisPort &&
    ['NODE', 'CLUSTER'].includes(redisMode) &&
    redisStreamName

  if (!redisConfiguredCorrectly) {
    throw new Error(
      'To configure Redis please specify REDIS_HOST, REDIS_PORT, ' +
        'REDIS_MODE and REDIS_STREAM_NAME environment variables',
    )
  }
  const redisClient = await connectToIoRedis(
    redisMode as RedisMode,
    redisHost,
    redisPort,
  )
  const xClient = new RedisStreams(redisClient)
  const stream = STREAM_NAME
  const group = GROUP_NAME
  const consumer = process.env.CONSUMER_NAME || 'assessment-worker'

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
  simpleConsumerGroupWorker(xClient, stream, group, consumer)
}

main()
  .then(() => {
    logger.debug('success')
  })
  .catch((err) => {
    console.error(err)
  })
