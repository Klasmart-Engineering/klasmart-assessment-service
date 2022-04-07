import 'reflect-metadata'
import { expect } from 'chai'
import {
  Connection,
  EntityManager,
  getManager,
  getRepository,
  Repository,
} from 'typeorm'

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

describe('Event-driven Worker', () => {
  let redisClient: RedisClientType
  let xClient: RedisStreams
  let dbConnection: Connection
  let entityManager: EntityManager
  let roomRepo: Repository<Room>
  let userContentScoresRepo: Repository<UserContentScore>
  let roomScoreProviderWorker: RoomScoresTemplateProvider2

  before(async () => {
    dbConnection = await createAssessmentDbConnection()
    entityManager = getManager(ASSESSMENTS_CONNECTION_NAME)
    roomRepo = getRepository(Room, ASSESSMENTS_CONNECTION_NAME)
    userContentScoresRepo = getRepository(
      UserContentScore,
      ASSESSMENTS_CONNECTION_NAME,
    )

    redisClient = await connectToRedisCache(
      process.env.REDIS_URL || 'redis://localhost:6379',
    )
    xClient = new RedisStreams(redisClient)
    roomScoreProviderWorker = new RoomScoresTemplateProvider2(
      new UserContentScoreFactory(),
      roomRepo,
      userContentScoresRepo,
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
    let entryId: string

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

    it('processed events are found in the database', async () => {
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
      let entryIds: string[]

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
        expect(results.map((x) => x.id)).to.have.members(entryIds)
        const parseJsonDataFn = () =>
          results.map((x) => JSON.parse(x.message.data))
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvents = parseJsonDataFn().map((x) => parseRawEvent(x))
        expect(parsedXapiEvents.length).to.be.equal(10)
        expect(parsedXapiEvents.every((x) => x !== null)).to.be.true
      })

      it('processed events are found in the database', async () => {
        let room = await entityManager.findOne(Room, 'room0', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(async (userX) => userX.answers || []),
          )
        ).flat()

        // console.log('===================================')
        // console.log({ room })
        // console.log({ userContentScores })
        // console.log(answers)
        // console.log('===================================')
        expect(room).to.not.be.undefined
        expect(userContentScores.length).to.equal(1)
        expect(answers.length).to.equal(10)
        const answer = answers[0]
        expect(answer).to.contain({
          roomId: 'room0',
          studentId: 'user0',
          contentKey: 'h5pId0',
        })
      })
    },
  )

  context(
    'Pushing 2 rooms, 2 user, 2 activities, 10 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 2,
        users: 2,
        activities: 2,
        events: 10,
      })
      let entryIds: string[]

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

      it('all xapiEvents have been pushed to the stream', async () => {
        expect(entryIds.length).to.equal(xapiRecords.length)
      })

      it('all pushed events can be reverse range queried from the stream', async () => {
        const results = await redisClient.xRevRange(streamName, '+', '-', {})
        expect(results).to.not.be.null
        expect(results?.length).to.be.equal(80)
        expect(results.map((x) => x.id)).to.have.members(entryIds)
        const parseJsonDataFn = () =>
          results.map((x) => JSON.parse(x.message.data))
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvents = parseJsonDataFn().map((x) => parseRawEvent(x))
        expect(parsedXapiEvents.length).to.be.equal(80)
      })

      it('room0 and its UsercontentScores and Answers are found in the database', async () => {
        let room0 = await entityManager.findOne(Room, 'room0', {})
        const userContentScores0 = (await room0?.scores) || []
        const answers0 = (
          await Promise.all(
            userContentScores0.map(async (userX) => userX.answers || []),
          )
        ).flat()
        expect(room0).to.not.be.undefined
        expect(userContentScores0.length).to.equal(4)
        expect(answers0.length).to.equal(40)
      })

      it('room1 and its UsercontentScores and Answers are found in the database', async () => {
        let room1 = await entityManager.findOne(Room, 'room1', {})
        const userContentScores1 = (await room1?.scores) || []
        const answers1 = (
          await Promise.all(
            userContentScores1.map(async (userX) => userX.answers || []),
          )
        ).flat()
        expect(room1).to.not.be.undefined
        expect(userContentScores1.length).to.equal(4)
        expect(answers1.length).to.equal(40)
      })
    },
  )

  context(
    'Pushing 1 room, 1 user, 1 activity, 5 + 5 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 1,
        users: 1,
        activities: 1,
        events: 10,
      })
      let entryIdsBatch1: string[]
      let entryIdsBatch2: string[]

      before(async () => {
        // delete stream from redis
        await redisClient.del(streamName)

        // create redis consumer group after the stream gets created
        const onlyLatest = false
        await xClient.createGroup(streamName, groupName, onlyLatest)

        // push fir st 5 events to a new stream that gets created automatically
        entryIdsBatch1 = await Promise.all(
          xapiRecords.slice(0, 5).map(async (xapiRecord) => {
            const event = {
              data: JSON.stringify(xapiRecord),
            }
            const entryId = await xClient.add(streamName, event)
            return entryId
          }),
        )

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

        // push next batch of 5 events for the same room/user/activity
        entryIdsBatch2 = await Promise.all(
          xapiRecords.slice(5, 10).map(async (xapiRecord) => {
            const event = {
              data: JSON.stringify(xapiRecord),
            }
            const entryId = await xClient.add(streamName, event)
            return entryId
          }),
        )

        // update state
        state.i += 1
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

      it('all xapiEvents have been pushed to the stream', async () => {
        expect(entryIdsBatch1.length + entryIdsBatch2.length).to.equal(
          xapiRecords.length,
        )
      })

      it('all pushed events can be reverse range queried from the stream', async () => {
        const results = await redisClient.xRevRange(streamName, '+', '-', {})
        expect(results).to.not.be.null
        expect(results?.length).to.be.equal(10)
        expect(results.map((x) => x.id)).to.have.members([
          ...entryIdsBatch1,
          ...entryIdsBatch2,
        ])
      })

      it('room0 and its UsercontentScores and Answers are found in the database', async () => {
        let room = await entityManager.findOne(Room, 'room0', {})
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
        expect(answers.length).to.equal(10)
      })
    },
  )

  context(
    'Pushing 2 rooms, 1 user, 1 activity, 2+2+2+2+2 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 2,
        users: 1,
        activities: 1,
        events: 10,
      })
      let entryIdsBatch01: string[]
      let entryIdsBatch02: string[]
      let entryIdsBatch03: string[]
      let entryIdsBatch04: string[]
      let entryIdsBatch05: string[]
      let entryIdsBatch11: string[]
      let entryIdsBatch12: string[]
      let entryIdsBatch13: string[]
      let entryIdsBatch14: string[]
      let entryIdsBatch15: string[]

      before(async () => {
        // delete stream from redis
        await redisClient.del(streamName)

        // create redis consumer group after the stream gets created
        const onlyLatest = false
        await xClient.createGroup(streamName, groupName, onlyLatest)

        const state = {
          i: 0,
          delays: 0,
        }
        const pushPullLoop = async (xapiRecords: XApiRecord[]) => {
          const entryIds = await Promise.all(
            xapiRecords.map(async (xapiRecord) =>
              xClient.add(streamName, {
                data: JSON.stringify(xapiRecord),
              }),
            ),
          )
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
          return entryIds
        }

        //
        entryIdsBatch01 = await pushPullLoop(xapiRecords.slice(0, 2))
        state.i += 1
        entryIdsBatch02 = await pushPullLoop(xapiRecords.slice(2, 4))
        state.i += 1
        entryIdsBatch03 = await pushPullLoop(xapiRecords.slice(4, 6))
        state.i += 1
        entryIdsBatch04 = await pushPullLoop(xapiRecords.slice(6, 8))
        state.i += 1
        entryIdsBatch05 = await pushPullLoop(xapiRecords.slice(8, 10))
        state.i += 1
        entryIdsBatch11 = await pushPullLoop(xapiRecords.slice(10, 12))
        state.i += 1
        entryIdsBatch12 = await pushPullLoop(xapiRecords.slice(12, 14))
        state.i += 1
        entryIdsBatch13 = await pushPullLoop(xapiRecords.slice(14, 16))
        state.i += 1
        entryIdsBatch14 = await pushPullLoop(xapiRecords.slice(16, 18))
        state.i += 1
        entryIdsBatch15 = await pushPullLoop(xapiRecords.slice(18, 20))
      })

      it('all xapiEvents have been pushed to the stream', async () => {
        expect(
          entryIdsBatch01.length +
            entryIdsBatch02.length +
            entryIdsBatch03.length +
            entryIdsBatch04.length +
            entryIdsBatch05.length +
            entryIdsBatch11.length +
            entryIdsBatch12.length +
            entryIdsBatch13.length +
            entryIdsBatch14.length +
            entryIdsBatch15.length,
        ).to.equal(xapiRecords.length)
      })

      it('room0 and its UsercontentScores and Answers are found in the database', async () => {
        let room = await entityManager.findOne(Room, 'room0', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(async (userX) => userX.answers || []),
          )
        ).flat()
        expect(room).to.not.be.undefined
        expect(userContentScores.length).to.equal(1)
        expect(answers.length).to.equal(10)
      })

      it('room1 and its UsercontentScores and Answers are found in the database', async () => {
        let room = await entityManager.findOne(Room, 'room1', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(async (userX) => userX.answers || []),
          )
        ).flat()
        expect(room).to.not.be.undefined
        expect(userContentScores.length).to.equal(1)
        expect(answers.length).to.equal(10)
      })
    },
  )

  context.only(
    'Pushing 10 rooms, 10 users, 10 activity, 10000 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const groupName = 'group1'
      const numRooms = 1
      const numUsers = 2
      const numActivities = 2
      const numEvents = 20
      const xapiRecords = createXapiEvents({
        rooms: numRooms,
        users: numUsers,
        activities: numActivities,
        events: numEvents,
      })
      let entryIds: string[] = []

      before(async function () {
        // this.timeout(60000)
        // delete stream from redis
        await redisClient.del(streamName)

        // create redis consumer group after the stream gets created
        const onlyLatest = false
        await xClient.createGroup(streamName, groupName, onlyLatest)

        const state = {
          i: 0,
          delays: 0,
        }
        const pushPullLoop = async (xapiRecords: XApiRecord[]) => {
          const entryIds = await Promise.all(
            xapiRecords.map(async (xapiRecord) =>
              xClient.add(streamName, {
                data: JSON.stringify(xapiRecord),
              }),
            ),
          )
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
          return entryIds
        }

        // loop
        const chunkSize = 50
        for (let idx = 0; idx < xapiRecords.length; idx += chunkSize) {
          const newEntryIds = await pushPullLoop(
            xapiRecords.slice(idx, idx + chunkSize),
          )
          entryIds = entryIds.concat(newEntryIds)
          state.i += 1
        }
      })

      it('all xapiEvents have been pushed to the stream', async () => {
        console.log(`xapiRecords.length =>`, xapiRecords.length)
        expect(entryIds.length).to.equal(xapiRecords.length)
      })

      it('all rooms have are found in the database', async () => {
        const rooms = await roomRepo.find()
        const userContentScores = (
          await Promise.all(
            rooms.map(async (room) => {
              const userXscores = (await room?.scores) || []
              console.log(
                `${room.roomId} userXscores.length: ${userXscores.length}`,
              )
              console.log(
                `${room.roomId} userXscores:`,
                userXscores
                  .map((x) => `${x.studentId}:${x.contentKey}`)
                  .join(' + '),
              )
              return userXscores
            }),
          )
        ).flat()
        const answers = (
          await Promise.all(
            userContentScores.map(async (userX) => userX.answers || []),
          )
        ).flat()
        console.log('rooms.length =', rooms.length)
        console.log('userContentScores.length =', userContentScores.length)
        console.log('answers.length =', answers.length)
        expect(rooms.length).to.equal(numRooms)
        expect(userContentScores.length).to.equal(
          numRooms * numUsers * numActivities,
        )
        expect(answers.length).to.equal(
          numRooms * numUsers * numActivities * numEvents,
        )
      })
    },
  )
})
