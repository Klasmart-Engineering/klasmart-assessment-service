import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

import { connectToRedisCache } from '../cache/redis'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { RedisStreams } from './redisApi'
import { STREAM_NAME, GROUP_NAME } from './index'
import { simpleConsumerGroupWorker } from './simpleConsumerGroupWorker'

useContainer(TypeormTypediContainer)

const logger = withLogger('worker')

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
