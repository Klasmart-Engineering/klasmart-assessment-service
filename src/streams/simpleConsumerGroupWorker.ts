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
  count?: number
  block?: number
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
    retryWhenFailed: true,
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

const defaultOptions = {
  minEvents: 0,
  maxDelays: 0,
  retryWhenFailed: false,
  count: 1000,
  block: 10000,
}

export const simpleConsumerGroupWorkerLoop = async (
  xClient: RedisStreams,
  stream: string,
  errorStream: string,
  group: string,
  consumer: string,
  calculator: RoomScoresTemplateProvider2,
  { i, delays }: State,
  opts?: Options,
): Promise<void> => {
  opts = { ...defaultOptions, ...opts }
  logger.info(
    `${consumer} (${i}): reading stream(${stream}) with group(${group}), ` +
      `count: ${opts.count} + block: ${opts.block}| (loop: ${i}, delays: ${delays})...`,
  )

  // check pending events
  let events =
    (await xClient.readGroup(stream, group, consumer, {
      count: opts.count,
      streamKey: '0',
    })) || []
  logger.info(`${consumer} (${i}): found ${events.length} pending events`)

  // if there are too few pending events, then fetch new ones
  if (events.length <= opts.minEvents) {
    logger.info(
      `${consumer} (${i}): very few or no pending messages, getting new ones...`,
    )
    const newEvents =
      (await xClient.readGroup(stream, group, consumer, {
        count: opts.count,
        block: opts.block,
        streamKey: '>',
      })) || []
    events = [...events, ...newEvents]
  }

  const tooFewEvents = events.length < opts.minEvents
  const hasNotExceededMaxDelays = delays < opts.maxDelays
  if (tooFewEvents && hasNotExceededMaxDelays) {
    logger.debug(
      `${consumer} (${i}): too few events found: ` +
        `${events.length}, need at least ${opts.minEvents}`,
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
    `${consumer} (${i}): total events found: ${events.length}, ` +
      `starting to process`,
  )

  // retry mechanism
  let attempt = 1
  let MAX_ATTEMPS = 3
  let EXP_DELAY = 1000 // milliseconds
  while (true) {
    try {
      await calculator.process(events, xClient, stream, errorStream, group)
      logger.debug(
        `${consumer} (${i}): total events JSON parsed: ${events.length}`,
      )
      break
    } catch (e) {
      logger.error(`Failed to process ${events.length} xapi events`, e)

      if (opts.retryWhenFailed && attempt < MAX_ATTEMPS) {
        attempt += 1
        await delay(attempt ** 2 * EXP_DELAY)
        continue
      }

      logger.error(
        `Failed to process ${events.length} xapi events ` +
          `and MAX_ATRTEMPTS ${MAX_ATTEMPS} exceeded`,
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
  }

  delays = 0
  logger.info(`${consumer} (${i}): FINISHED processing loop ${i}`)
  return
}
