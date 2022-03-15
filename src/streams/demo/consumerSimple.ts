import 'reflect-metadata'
import fs from 'fs'
import path from 'path'
import { connectToRedisCache } from '../../cache/redis'
import { RedisStreams, STREAM_NAME, GROUP_NAME } from './index'
import { delay } from '../../helpers/delay'

const MIN_EVENTS = 50
const MAX_DELAYS = 5

export const consume = async (xClient: RedisStreams) => {
  const filename = path.join(__dirname, `./data/consumerSimple.txt`)
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
        console.log(`CONSUMER: acknowledge id`, id)
      }
    })
  }

  let cursorKey: string = '$'

  while (true) {
    if (delays > 0) {
      await delay(1000)
    }
    console.log(`CONSUMER: reading group (loop ${i}, delays: ${delays})...`)
    i += 1

    // check pending events
    let events =
      (
        await xClient.read({
          count: 100,
          block: 5000,
          streamKey: cursorKey,
        })
      )?.messages || []

    console.log(`CONSUMER: found ${events.length} events...`)
    if (events.length === 0) {
      console.log(`CONSUMER: no events found. CONTNUE`)
      continue
    }

    // if there are too few pending events, then fetch new ones
    const tooFewEvents = events && events.length < MIN_EVENTS
    const hasNotExceededMaxDelays = delays < MAX_DELAYS
    if (tooFewEvents && hasNotExceededMaxDelays) {
      console.log(`CONSUMER: too few events found: ${events.length}. CONTNUE`)
      delays += 1
      continue
    }

    // everything is good, process events
    await processMessages(events)
    const lastEvent = events.at(-1)
    console.log(`CONSUMER: last event:`, lastEvent)
    cursorKey = lastEvent.id
    delays = 0
    console.log(`CONSUMER: FINISHED processing`)
  }
}

const main = async () => {
  console.log('🌭 Consuming events!')
  const url = process.env.REDIS_URL || ''
  const client = await connectToRedisCache(url)
  const xClient = new RedisStreams(client)

  consume(xClient)
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
