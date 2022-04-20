import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { delay } from '../helpers/delay'
import { STREAM_NAME, GROUP_NAME, ERROR_STREAM_NAME } from './index'
import { connectToIoRedis, RedisMode, RedisStreams } from './redisApi'
import { simpleConsumerGroupWorker } from './simpleConsumerGroupWorker'
import { createXapiEvents } from '../../tests/utils/createXapiEvents'

const logger = withLogger('simpleConsumerGroupWorker.test')

useContainer(TypeormTypediContainer)

const produce = async (
  xClient: RedisStreams,
  stream: string,
  xapiEvents: any[],
  delayMs: number = 100,
) => {
  for (const xapiEvent of xapiEvents) {
    await delay(delayMs)
    const event = {
      data: JSON.stringify(xapiEvent),
    }
    const entryId = await xClient.add(stream, event)
    console.log(
      `simpleConsumerGroupWorker > PRODUCER >> add entryId: ${entryId}`,
    )
  }
}

const main = async () => {
  logger.info('⏳ Starting Assessment Worker')
  const redisMode = (process.env.REDIS_MODE || 'NODE').toUpperCase()
  const redisPort = Number(process.env.REDIS_PORT) || 6379
  const redisHost = process.env.REDIS_HOST
  const redisStreamName = process.env.REDIS_STREAM || 'xapi:events'

  const redisConfiguredCorrectly =
    redisHost &&
    redisPort &&
    ['NODE', 'CLUSTER'].includes(redisMode) &&
    redisStreamName

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
  const stream = STREAM_NAME
  const errorStream = ERROR_STREAM_NAME
  const group = GROUP_NAME
  const consumer = process.env.CONSUMER_NAME || 'assessment-worker'

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  await connectToAssessmentDatabase(assessmentDatabaseUrl)

  logger.info('🦑 Creating events...')
  const rawXapiEvents = createXapiEvents({
    rooms: 6,
    users: 6,
    activities: 6,
    events: 10,
  })

  try {
    await xClient.createGroup(stream, group)
  } catch (e) {
    logger.error(
      `Error while trying to create a new Consumer Group ${group} for stream ${stream}`,
      e,
    )
  }

  // produce events
  logger.info('🚜 Start producing xapi events to be added to a Redis Stream')
  produce(xClient, stream, rawXapiEvents, 100)

  // infinite process
  logger.info('🌭 Assessment Worker ready to consume xapi events')
  simpleConsumerGroupWorker(xClient, stream, errorStream, group, consumer)
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
