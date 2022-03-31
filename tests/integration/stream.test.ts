import 'reflect-metadata'
import { expect } from 'chai'
import { Connection, EntityManager, getManager } from 'typeorm'

import { XApiRecordBuilder } from '../builders'
import { createAssessmentDbConnection } from '../utils/testConnection'
import { connectToRedisCache, RedisClientType } from '../../src/cache/redis'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import {
  Answer,
  Room,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { delay } from '../../src/helpers/delay'
import { createXapiEvents } from '../../src/streams/helpers'
import { RedisStreams } from '../../src/streams/redisApi'
import { simpleConsumerGroupWorkerLoop } from '../../src/streams/simpleConsumerGroupWorker'
import { RoomScoresTemplateProvider2 } from '../../src/streams/calculateScores'
import { UserContentScoreFactory } from '../../src/providers/userContentScoreFactory'
import { XApiRecord } from '../../src/db/xapi'

// const produce = async (
//   xClient: RedisStreams,
//   stream: string,
//   xapiEvents: any[],
//   delayMs: number = 100,
// ) => {
//   for (const xapiEvent of xapiEvents) {
//     await delay(delayMs)
//     const event = {
//       data: JSON.stringify(xapiEvent),
//     }
//     const entryId = await xClient.add(stream, event)
//     console.log(
//       `simpleConsumerGroupWorker > PRODUCER >> add entryId: ${entryId}`,
//     )
//   }
// }

describe.only('Worker', () => {
  let redisClient: RedisClientType
  let xClient: RedisStreams
  let dbConnection: Connection
  let entityManager: EntityManager
  let processFn: (rawXapiEvents: XApiRecord[]) => Promise<void>

  before(async () => {
    dbConnection = await createAssessmentDbConnection()
    entityManager = getManager(ASSESSMENTS_CONNECTION_NAME)

    redisClient = await connectToRedisCache(
      process.env.REDIS_URL || 'redis://localhost:6379',
    )
    xClient = new RedisStreams(redisClient)
    const roomScoreProviderWorker = new RoomScoresTemplateProvider2(
      new UserContentScoreFactory(),
      entityManager,
    )
    processFn = roomScoreProviderWorker.process
  })

  after(async () => {
    await redisClient.quit()
    await dbConnection?.close()
  })

  context('Streaming', () => {
    before(async () => {
      console.log('context before')
      const streamName = 'stream1'
      const groupName = 'group1'
      // const xapiEvents = createXapiEvents({
      //   rooms: 1,
      //   users: 1,
      //   activities: 1,
      //   events: 1,
      // })
      // const streamEntries = await Promise.all(
      //   xapiEvents.map(async (xapiEvent) => {
      //     const event = {
      //       data: JSON.stringify(xapiEvent),
      //     }
      //     const entryId = await xClient.add(streamName, event)
      //     return entryId
      //   }),
      // )
      const xapiRecord1 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user1')
        .withH5pId('h5p1')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse(undefined)
        .withServerTimestamp(100000000000)
        .withClientTimestamp(100000000000)
        .build()
      const event = {
        data: JSON.stringify(xapiRecord1),
      }
      const entryId = await xClient.add(streamName, event)
      console.log({ entryId })

      const state = {
        i: 0,
        delays: 0,
      }
      await simpleConsumerGroupWorkerLoop(
        xClient,
        streamName,
        groupName,
        'consumer1',
        processFn,
        state,
        {
          minEvents: 0,
          maxDelays: 0,
        },
      )
    })

    it('worker starts', async () => {
      let room = await entityManager.findOne(Room, 'room1', {})
      console.log('===================================')
      console.log({ room })
      expect(true).to.be.equal(true)
    })
  })
})
