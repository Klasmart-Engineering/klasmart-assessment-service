import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'

import { XApiRecord } from '../db/xapi'
import { delay } from '../helpers/delay'
import { RedisStreams } from './redisApi'
import { RoomScoresTemplateProvider2 } from './calculateScores'

useContainer(TypeormTypediContainer)

const logger = withLogger('simpleConsumerGroupWorker')

type State = {
  i: number
  delays: number
}

type Options = {
  minEvents: number
  maxDelays: number
  retryWhenFailed: boolean
}

export const simpleConsumerGroupWorker = async (
  xClient: RedisStreams,
  stream: string,
  errorStream: string,
  group: string,
  consumer: string,
  opts: Options = {
    minEvents: 0,
    maxDelays: 0,
    retryWhenFailed: false,
  },
) => {
  const roomScoreProviderWorker = TypeormTypediContainer.get(
    RoomScoresTemplateProvider2,
  )

  const state: State = {
    i: 0,
    delays: 0,
  }

  while (true) {
    await simpleConsumerGroupWorkerLoop(
      xClient,
      stream,
      errorStream,
      group,
      consumer,
      roomScoreProviderWorker,
      state,
      {
        minEvents: opts.minEvents,
        maxDelays: opts.maxDelays,
        retryWhenFailed: opts.retryWhenFailed,
      },
    )
    state.i = (state.i + 1) % 1_000
  }
}

export const simpleConsumerGroupWorkerLoop = async (
  xClient: RedisStreams,
  stream: string,
  errorStream: string,
  group: string,
  consumer: string,
  calculator: RoomScoresTemplateProvider2,
  { i, delays }: State,
  opts: Options = {
    minEvents: 0,
    maxDelays: 0,
    retryWhenFailed: false,
  },
): Promise<void> => {
  logger.info(
    `${consumer} (${i}): reading group (loop ${i}, delays: ${delays})...`,
  )

  // check pending events
  let events =
    (await xClient.readGroup(stream, group, consumer, {
      count: 1000,
      streamKey: '0',
    })) || []
  logger.debug(`${consumer} (${i}): found ${events.length} pending events`)

  // if there are too few pending events, then fetch new ones
  if (events.length <= opts.minEvents) {
    logger.debug(
      `${consumer} (${i}): very few or no pending messages, getting new ones...`,
    )
    const newEvents =
      (await xClient.readGroup(stream, group, consumer, {
        count: 1000,
        block: 0,
        streamKey: '>',
      })) || []
    events = [...events, ...newEvents]
  }

  const tooFewEvents = events.length < opts.minEvents
  const hasNotExceededMaxDelays = delays < opts.maxDelays
  if (tooFewEvents && hasNotExceededMaxDelays) {
    logger.debug(
      `${consumer} (${i}): too few events found: ${events.length}, need at least ${opts.minEvents}`,
    )
    delays += 1
    return
  }

  // if no events have been found, sleep for a few seconds and continue
  if (events.length === 0) {
    logger.info(
      `${consumer} (${i}): no events found: sleeping for 5 seconds...`,
    )
    await delay(5000)
    return
  }

  // Process events
  logger.info(
    `${consumer} (${i}): total events found: ${events.length}, starting to process`,
  )
  const rawXapiEvents: XApiRecord[] = events.map(({ id, message }) => {
    return JSON.parse(message?.data)
  })

  // retry mechanism
  let attempt = 1
  let MAX_ATTEMPS = 3
  let EXP_DELAY = 1000
  while (true) {
    try {
      await calculator.process(rawXapiEvents)
      logger.debug(
        `${consumer} (${i}): total events JSON parsed: ${rawXapiEvents.length}`,
      )
      break
    } catch (e) {
      logger.error(`Failed to process ${rawXapiEvents.length} xapi events`, e)
      if (!opts.retryWhenFailed) {
        break
      }
      if (attempt >= MAX_ATTEMPS) {
        logger.error(
          `Failed to process ${rawXapiEvents.length} xapi events ${MAX_ATTEMPS}`,
          e,
        )
        logger.error(`Acknowledging and pushing events to error stream`)
        const eventsIds = events.map(({ id }) => id)
        await Promise.all(
          events.map(async (event) => {
            xClient.add(errorStream, event.message)
          }),
        )
        logger.debug(
          `${consumer} (${i}): acknowledging events: ${eventsIds.length}`,
        )
        await xClient.ack(stream, group, eventsIds)
        break
      }
      delay(attempt ** 2 * EXP_DELAY)
    }
    attempt += 1
  }

  // Aknowledge the processed events
  const eventsIds = events.map(({ id }) => id)
  logger.debug(`${consumer} (${i}): acknowledging events: ${eventsIds.length}`)
  await xClient.ack(stream, group, eventsIds)

  delays = 0
  logger.info(`${consumer} (${i}): FINISHED processing loop ${i}`)
  return
}
