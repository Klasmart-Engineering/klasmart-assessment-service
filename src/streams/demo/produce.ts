import 'reflect-metadata'
import fs from 'fs'
import path from 'path'
import { connectToRedisCache } from '../../cache/redis'
import { RedisStreams, STREAM_NAME, GROUP_NAME } from './index'
import { delay } from '../../helpers/delay'

interface Event {
  data: string
  id: string
  roomId: string
}

function* incrementGenerator() {
  let counter = 1
  while (true) {
    yield counter
    counter += 1
  }
}

const increment = incrementGenerator()

function* incrementWithSkip(skip: number) {
  let counter = 1
  while (true) {
    yield Math.floor(counter / skip)
    counter += 1
  }
}

export const continuouslyGenerateEvents = async (
  xClient: RedisStreams,
  pause: number | undefined,
) => {
  const filename = path.join(__dirname, './data/producer.txt')
  fs.writeFileSync(filename, '')

  while (true) {
    await delay(pause || 100)

    const event = {
      data: '123',
      id: String(increment.next().value),
      roomId: String(Math.floor(Math.random() * 10)),
    }
    const entryId = await xClient.add(event)
    fs.writeFileSync(filename, JSON.stringify(event) + '\r\n', {
      flag: 'a+',
    })
    console.log(`PRODUCER >> add entryId: ${entryId}`)
  }
}

const main = async () => {
  console.log('🚜 Producing events!')
  const url = process.env.REDIS_URL || ''
  const client = await connectToRedisCache(url)
  const xClient = new RedisStreams(client)

  continuouslyGenerateEvents(xClient, 10)
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
