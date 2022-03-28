import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

import { connectToRedisCache } from '../cache/redis'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { delay } from '../helpers/delay'
import { STREAM_NAME, GROUP_NAME } from './index'
import { createXapiEvents } from './helpers'
import { RedisStreams } from './redisApi'
import { simpleConsumerGroupWorker } from './simpleConsumerGroupWorker'

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
  const redisUrl = process.env.REDIS_URL || ''
  if (!redisUrl) {
    throw new Error('Please specify a value for REDIS_URL')
  }
  const client = await connectToRedisCache(redisUrl)
  const xClient = new RedisStreams(client)
  const stream = STREAM_NAME
  const group = GROUP_NAME
  const consumer = process.env.CONSUMER_NAME || 'assessment-worker'

  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  await connectToAssessmentDatabase(assessmentDatabaseUrl)

  logger.info('🦑 Creating events...')
  const rawXapiEvents = createXapiEvents({})

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
  simpleConsumerGroupWorker(xClient, stream, group, consumer)
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
