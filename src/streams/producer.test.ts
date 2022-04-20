import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
useContainer(TypeormTypediContainer)

// import { connectToRedisCache } from '../cache/redis'
import { connectToIoRedis, RedisMode, RedisStreams } from './redisApi'
import { delay } from '../helpers/delay'
import { createXapiEvents } from './helpers'

export const STREAM_NAME = 'mystream'
export const GROUP_NAME = 'mygroup'

const main = async () => {
  const redisMode = (process.env.REDIS_MODE || 'NODE').toUpperCase()
  const redisPort = Number(process.env.REDIS_PORT) || 6379
  const redisHost = process.env.REDIS_HOST
  const redisStreamName = process.env.REDIS_STREAM_NAME || 'xapi:events'

  const redisConfiguredCorrectly =
    redisHost &&
    redisPort &&
    ['NODE', 'CLUSTER'].includes(redisMode) &&
    redisStreamName

  if (!redisConfiguredCorrectly) {
    throw new Error(
      'To configure Redis please specify REDIS_HOST, REDIS_PORT, ' +
        'REDIS_MODE and REDIS_STREAM_NAME environment variables',
    )
  }
  const redisClient = await connectToIoRedis(
    redisMode as RedisMode,
    redisHost,
    redisPort,
  )
  const xClient = new RedisStreams(redisClient)

  const xapiEvents = createXapiEvents({
    rooms: 10,
    users: 6,
    activities: 6,
    events: 10,
  })

  console.log('🚜 Starting to produce events!')
  for (const xapiEvent of xapiEvents) {
    await delay(100)
    const event = {
      data: JSON.stringify(xapiEvent),
    }
    const entryId = await xClient.add(STREAM_NAME, event)
    console.log(
      `producer > PRODUCER >> add [room: ${xapiEvent.roomId}, user: ${xapiEvent.userId}] entryId: ${entryId}`,
    )
  }
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
