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
import {
  parseRawEvent,
  RoomScoresTemplateProvider2,
} from '../../src/streams/calculateScores'
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

describe.only('Event-driven Worker', () => {
  let redisClient: RedisClientType
  let xClient: RedisStreams
  let dbConnection: Connection
  let entityManager: EntityManager
  let roomScoreProviderWorker: RoomScoresTemplateProvider2

  before(async () => {
    dbConnection = await createAssessmentDbConnection()
    entityManager = getManager(ASSESSMENTS_CONNECTION_NAME)

    redisClient = await connectToRedisCache(
      process.env.REDIS_URL || 'redis://localhost:6379',
    )
    xClient = new RedisStreams(redisClient)
    roomScoreProviderWorker = new RoomScoresTemplateProvider2(
      new UserContentScoreFactory(),
      entityManager,
    )
  })

  after(async () => {
    await redisClient.quit()
    await dbConnection?.close()
  })

  context('Pushing 1 event to a Redis stream with 1 Consumer', () => {
    const streamName = 'stream1'
    const groupName = 'group1'
    const xapiEvent1 = new XApiRecordBuilder()
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
    const xapiRecord1 = xapiEvent1.build()
    let entryId: String

    before(async () => {
      // delete stream from redis
      await redisClient.del(streamName)

      // create redis consumer group after the stream gets created
      const onlyLatest = false
      await xClient.createGroup(streamName, groupName, onlyLatest)

      // push events to a new stream that gets created automatically
      const event = {
        data: JSON.stringify(xapiRecord1),
      }
      entryId = await xClient.add(streamName, event)
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
        roomScoreProviderWorker,
        state,
        {
          minEvents: 0,
          maxDelays: 0,
        },
      )
    })

    after(async () => {
      // await xClient.deleteGroup(streamName, groupName)
    })

    it('stream has been created', async () => {
      const info = await redisClient.xInfoStream(streamName)
      expect(info).to.not.be.null
      expect(info).to.not.be.undefined
      expect(info.length).to.not.be.null
      expect(info.length).to.not.be.undefined
      expect(info.length).to.be.greaterThanOrEqual(1)
    })

    it('consumer group has been created', async () => {
      const info = await redisClient.xInfoGroups(streamName)
      expect(info).to.be.lengthOf(1)
      expect(info[0].name).to.be.equal(groupName)
    })

    it('events can be read from the stream', async () => {
      const result = await xClient.read(streamName, {
        count: 10,
        block: 100,
        streamKey: '0',
      })
      expect(result).to.not.be.null
      expect(result?.name).to.be.equal(streamName)
      expect(result?.messages).to.not.be.undefined
      expect(result?.messages?.length).to.be.greaterThanOrEqual(1)
      expect(result?.messages[0].id).to.not.be.undefined
      expect(result?.messages[0].message).to.not.be.undefined
      const parseJsonDataFn = () => JSON.parse(result?.messages[0].message.data)
      expect(parseJsonDataFn).to.not.throw
      const parsedXapiEvent = parseRawEvent(parseJsonDataFn())
      expect(parsedXapiEvent).to.not.be.undefined
    })

    it('events can be reverse range queried from the stream', async () => {
      const results = await redisClient.xRevRange(streamName, '+', '-', {})
      expect(results).to.not.be.null
      expect(results?.length).to.be.greaterThanOrEqual(1)
      expect(results?.[0].id).to.not.be.undefined
      expect(results?.[0].id).to.equal(entryId)
      expect(results?.[0].message).to.not.be.undefined
      expect(results?.[0].message.data).to.not.be.undefined
      const parseJsonDataFn = () => JSON.parse(results?.[0].message.data)
      expect(parseJsonDataFn).to.not.throw
      const parsedXapiEvent = parseRawEvent(parseJsonDataFn())
      expect(parsedXapiEvent).to.not.be.null
      expect(parsedXapiEvent).to.contains({
        roomId: 'room1',
        userId: 'user1',
        h5pId: 'h5p1',
        h5pName: 'h5pName',
        h5pType: 'h5pType',
      }).all
    })

    it('worker starts', async () => {
      let room = await entityManager.findOne(Room, 'room1', {})
      const userContentScores = (await room?.scores) || []
      const answers = (
        await Promise.all(
          userContentScores.map(async (userX) => userX.answers || []),
        )
      ).flat()

      console.log('===================================')
      console.log({ room })
      console.log({ userContentScores })
      console.log(answers)
      console.log('===================================')
      expect(room).to.not.be.undefined
      expect(userContentScores.length).to.equal(1)
      expect(answers.length).to.equal(1)
      const answer = answers[0]
      expect(answer).to.contain({
        roomId: 'room1',
        studentId: 'user1',
        contentKey: 'h5p1',
      })
    })
  })

  context(
    'Pushing 1 room, 1 user, 1 activity, 10 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 1,
        users: 1,
        activities: 1,
        events: 10,
      })
      let entryIds: String[]

      before(async () => {
        // delete stream from redis
        await redisClient.del(streamName)

        // create redis consumer group after the stream gets created
        const onlyLatest = false
        await xClient.createGroup(streamName, groupName, onlyLatest)

        // push events to a new stream that gets created automatically
        entryIds = await Promise.all(
          xapiRecords.map(async (xapiRecord) => {
            const event = {
              data: JSON.stringify(xapiRecord),
            }
            const entryId = await xClient.add(streamName, event)
            return entryId
          }),
        )
        console.log({ entryIds })

        const state = {
          i: 0,
          delays: 0,
        }
        await simpleConsumerGroupWorkerLoop(
          xClient,
          streamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
          {
            minEvents: 0,
            maxDelays: 0,
          },
        )
      })

      it('events can be read from the stream', async () => {
        const result = await xClient.read(streamName, {
          count: 10,
          block: 100,
          streamKey: '0',
        })
        expect(result).to.not.be.null
        expect(result?.name).to.be.equal(streamName)
        expect(result?.messages).to.not.be.undefined
        expect(result?.messages?.length).to.equal(10)
        expect(result?.messages[0].id).to.not.be.undefined
        expect(result?.messages[0].message).to.not.be.undefined
        const parseJsonDataFn = () =>
          JSON.parse(result?.messages[0].message.data)
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvent = parseRawEvent(parseJsonDataFn())
        expect(parsedXapiEvent).to.not.be.undefined
      })

      it('events can be reverse range queried from the stream', async () => {
        const results = await redisClient.xRevRange(streamName, '+', '-', {})
        expect(results).to.not.be.null
        expect(results?.length).to.be.equal(10)
        expect(results.map((x) => x.id)).to.deep.equal(entryIds)
        const parseJsonDataFn = () =>
          results.map((x) => JSON.parse(x.message.data))
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvents = parseJsonDataFn().map((x) => parseRawEvent(x))
        expect(parsedXapiEvents.length).to.be.equal(10)
        expect(parsedXapiEvents.every((x) => x !== null)).to.be.true
      })
    },
  )
})
