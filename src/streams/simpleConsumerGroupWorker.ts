import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

import { connectToRedisCache } from '../cache/redis'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { XApiRecord } from '../db/xapi'
import { delay } from '../helpers/delay'
import { RedisStreams } from './redisApi'
import { STREAM_NAME, GROUP_NAME } from './index'
import { RoomScoresTemplateProvider2 } from './calculateScores'

useContainer(TypeormTypediContainer)

const logger = withLogger('simpleConsumerGroupWorker')

const MIN_EVENTS = 50
const MAX_DELAYS = 5

export const simpleConsumerGroupWorker = async (
  xClient: RedisStreams,
  stream: string,
  group: string,
  consumer: string,
) => {
  const roomScoreProviderWorker = TypeormTypediContainer.get(
    RoomScoresTemplateProvider2,
  )

  let i = 0
  let delays = 0

  while (true) {
    await delay(1000)
    logger.debug(
      `CONSUMER ${consumer}: reading group (loop ${i}, delays: ${delays})...`,
    )
    i += 1

    // check pending events
    let events =
      (await xClient.readGroup(stream, group, consumer, {
        count: 1000,
        block: 0,
        streamKey: '0',
      })) || []
    logger.debug(`CONSUMER ${consumer}: found ${events.length} pending events`)

    // if there are too few pending events, then fetch new ones
    if (!events || events.length <= MIN_EVENTS) {
      logger.debug(
        `CONSUMER ${consumer}: very few or no pending messages, getting new ones...`,
      )
      const newEvents =
        (await xClient.readGroup(stream, group, consumer, {
          count: 1000,
          block: 0,
          streamKey: '>',
        })) || []
      events = [...events, ...newEvents]
    }

    const tooFewEvents = events.length < MIN_EVENTS
    const hasNotExceededMaxDelays = delays < MAX_DELAYS
    if (tooFewEvents && hasNotExceededMaxDelays) {
      logger.debug(
        `CONSUMER ${consumer}: too few events found: ${events.length}`,
      )
      delays += 1
      continue
    }

    // Process events
    logger.debug(`CONSUMER ${consumer}: too few events found: ${events.length}`)
    const rawXapiEvents: XApiRecord[] = events.map(({ id, message }) => {
      console.warn('\n\n\njuhilgkyfdrtfugihojpk[ijouhgyfgiop9i0[puyigtuf')
      console.log(message)
      return JSON.parse(message?.data)
    })
    await roomScoreProviderWorker.process(rawXapiEvents)

    // Aknowledge the processed events
    const eventsIds = events.map(({ id }) => id)
    logger.debug(`CONSUMER ${consumer}: acknowledging even ids ${eventsIds}`)
    await xClient.ack(stream, group, eventsIds)

    delays = 0
    logger.debug(`CONSUMER ${consumer}: FINISHED processing loop ${i}`)
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
