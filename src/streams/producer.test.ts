import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
useContainer(TypeormTypediContainer)

import { connectToRedisCache } from '../cache/redis'
import { RedisStreams } from './redisApi'
import { delay } from '../helpers/delay'
import { createXapiEvents } from './helpers'

export const STREAM_NAME = 'mystream'
export const GROUP_NAME = 'mygroup'

const main = async () => {
  const redisUrl = process.env.REDIS_URL || ''
  if (!redisUrl) {
    throw new Error('Please specify a value for REDIS_URL')
  }
  const client = await connectToRedisCache(redisUrl)
  const xClient = new RedisStreams(client)

  const xapiEvents = createXapiEvents({
    rooms: 100,
    users: 6,
    activities: 2,
    events: 5,
  })

  console.log('🚜 Starting to produce events!')
  for (const xapiEvent of xapiEvents) {
    await delay(10)
    const event = {
      data: JSON.stringify(xapiEvent),
    }
    const entryId = await xClient.add(STREAM_NAME, event)
    console.log(`producer > PRODUCER >> add entryId: ${entryId}`)
  }
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
