import 'reflect-metadata'
import fs from 'fs'
import path from 'path'
import { connectToRedisCache } from '../cache/redis'
import { RedisStreams, STREAM_NAME, GROUP_NAME } from './index'
import { delay } from '../helpers/delay'

const MIN_EVENTS = 50
const MAX_DELAYS = 5

export const consume = async (xClient: RedisStreams, consumerName: string) => {
  const filename = path.join(
    __dirname,
    `data/consumerGroup_${consumerName}.txt`,
  )
  fs.writeFileSync(filename, '')
  let i = 0
  let delays = 0

  const processMessages = async (messages: any[]) => {
    await delay(1000)
    messages.forEach(async (entry) => {
      fs.writeFileSync(filename, JSON.stringify(entry) + '\r\n', {
        flag: 'a+',
      })
      const { id } = entry
      if (id) {
        console.log(`CONSUMER ${consumerName}: acknowledge id`, id)
        await xClient.ack(id)
      }
    })
  }

  while (true) {
    await delay(1000)
    console.log(
      `CONSUMER ${consumerName}: reading group (loop ${i}, delays: ${delays})...`,
    )
    i += 1

    // check pending events
    let events =
      (
        await xClient.readGroup(GROUP_NAME, consumerName, {
          count: 100,
          block: 0,
          streamKey: '0',
        })
      )?.messages || []

    // if there are too few pending events, then fetch new ones
    if (!events || events.length <= MIN_EVENTS) {
      console.log(
        `CONSUMER ${consumerName}: no pending messages, getting new ones...`,
      )
      const newEvents =
        (
          await xClient.readGroup(GROUP_NAME, consumerName, {
            count: 1000,
            block: 0,
            streamKey: '>',
          })
        )?.messages || []
      events = [...events, ...newEvents]
    }

    const tooFewEvents = events && events.length < MIN_EVENTS
    const hasNotExceededMaxDelays = delays < MAX_DELAYS
    if (tooFewEvents && hasNotExceededMaxDelays) {
      console.log(
        `CONSUMER ${consumerName}: too few events found: ${events.length}. CONTNUE`,
      )
      delays += 1
      continue
    }
    await processMessages(events)
    delays = 0
    console.log(`CONSUMER ${consumerName}: FINISHED processing`)
  }
}

const main = async () => {
  console.log('🌭 Consuming events!')
  const url = process.env.REDIS_URL || ''
  const client = await connectToRedisCache(url)
  const xClient = new RedisStreams(client)

  // await xClient.createGroup(GROUP_NAME)

  const consumers = ['1', '2']
  for (let name of consumers) {
    consume(xClient, name)
  }
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
