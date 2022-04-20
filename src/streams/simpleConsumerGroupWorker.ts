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

const MIN_EVENTS = 0
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
  const processFn = roomScoreProviderWorker.process
  console.log('processFn ===>', processFn)

  const state: State = {
    i: 0,
    delays: 0,
  }

  while (true) {
    await simpleConsumerGroupWorkerLoop(
      xClient,
      stream,
      group,
      consumer,
      roomScoreProviderWorker,
      state,
      {
        minEvents: MIN_EVENTS,
        maxDelays: MAX_DELAYS,
      },
    )
    state.i = +1
  }
}

type State = {
  i: number
  delays: number
}

type Options = {
  minEvents: number
  maxDelays: number
}

export const simpleConsumerGroupWorkerLoop = async (
  xClient: RedisStreams,
  stream: string,
  group: string,
  consumer: string,
  calculator: RoomScoresTemplateProvider2,
  { i, delays }: State,
  opts: Options = {
    minEvents: 0,
    maxDelays: 0,
  },
): Promise<void> => {
  // await delay(1000)
  logger.debug(
    `${consumer} (${i}): reading group (loop ${i}, delays: ${delays})...`,
  )

  // check pending events
  let events =
    (await xClient.readGroup(stream, group, consumer, {
      count: 1000,
      streamKey: '0',
    })) || []
  logger.debug(
    `CONSUMER ${consumer} (${i}): found ${events.length} pending events`,
  )

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
    console.log('newEvents ===>', { newEvents })
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
    logger.debug(
      `${consumer} (${i}): no events found: sleeping for 5 seconds...`,
    )
    // await delay(1000)
    return
  }

  // Process events
  logger.debug(`${consumer}: total events found: ${events.length}`)
  const rawXapiEvents: XApiRecord[] = events.map(({ id, message }) => {
    return JSON.parse(message?.data)
  })
  await calculator.process(rawXapiEvents)
  logger.debug(`${consumer} (${i}): total events JSON parsed: ${events.length}`)

  // Aknowledge the processed events
  const eventsIds = events.map(({ id }) => id)
  logger.debug(`${consumer} (${i}): acknowledging events: ${eventsIds.length}`)
  await xClient.ack(stream, group, eventsIds)

  delays = 0
  logger.debug(`${consumer} (${i}): FINISHED processing loop ${i}`)
  return
}
