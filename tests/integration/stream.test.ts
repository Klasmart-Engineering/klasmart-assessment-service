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
import {
  connectToIoRedis,
  IoRedisClientType,
  RedisMode,
} from '../../src/cache/redis'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import {
  Answer,
  Room,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { createXapiEvents } from '../utils/createXapiEvents'
import { RedisStreams } from '../../src/streams/redisApi'
import { simpleConsumerGroupWorkerLoop } from '../../src/streams/simpleConsumerGroupWorker'
import {
  parseRawEvent,
  RoomScoresTemplateProvider2,
} from '../../src/streams/calculateScores'
import { UserContentScoreFactory } from '../../src/providers/userContentScoreFactory'
import { XApiRecord } from '../../src/db/xapi'

describe('Event-driven Worker', () => {
  let redisClient: IoRedisClientType
  let xClient: RedisStreams
  let dbConnection: Connection
  let entityManager: EntityManager
  let roomRepo: Repository<Room>
  let userContentScoresRepo: Repository<UserContentScore>
  let answerRepo: Repository<Answer>
  let roomScoreProviderWorker: RoomScoresTemplateProvider2

  before(async () => {
    dbConnection = await createAssessmentDbConnection()
    entityManager = getManager(ASSESSMENTS_CONNECTION_NAME)
    roomRepo = getRepository(Room, ASSESSMENTS_CONNECTION_NAME)
    userContentScoresRepo = getRepository(
      UserContentScore,
      ASSESSMENTS_CONNECTION_NAME,
    )
    answerRepo = getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)

    const redisMode = (
      process.env.REDIS_MODE || 'node'
    ).toUpperCase() as RedisMode
    const redisHost = process.env.REDIS_HOST || 'localhost'
    const redisPort = Number(process.env.REDIS_PORT) || 6379

    redisClient = await connectToIoRedis(redisMode, redisHost, redisPort)
    xClient = new RedisStreams(redisClient)
    roomScoreProviderWorker = new RoomScoresTemplateProvider2(
      new UserContentScoreFactory(),
      roomRepo,
      userContentScoresRepo,
      answerRepo,
      entityManager,
    )
  })

  after(async () => {
    await redisClient.quit()
    await dbConnection?.close()
  })

  context('Pushing 1 event to a Redis stream with 1 Consumer', () => {
    const streamName = 'stream1'
    const errorStreamName = 'errorstream1'
    const groupName = 'group1'
    const xapiEvent1 = new XApiRecordBuilder()
      .withRoomId('room1')
      .withUserId('user1')
      .withH5pId('h5p1')
      .withH5pSubId(undefined)
      .withH5pName('h5pName')
      .withH5pType('h5pType')
      .withScore({ min: 0, max: 2, raw: 1 })
      .withResponse('')
      .withServerTimestamp(100000000000)
      .withClientTimestamp(100000000000)
    const xapiRecord1 = xapiEvent1.build()
    let entryId: string | null

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

      const state = {
        i: 0,
        delays: 0,
      }
      await simpleConsumerGroupWorkerLoop(
        xClient,
        streamName,
        errorStreamName,
        groupName,
        'consumer1',
        roomScoreProviderWorker,
        state,
      )
    })

    after(async () => {
      await xClient.deleteGroup(streamName, groupName)
    })

    it('stream has been created', async () => {
      const info = await xClient.infoStream(streamName)
      expect(info).to.not.be.null
      expect(info).to.not.be.undefined
      expect(info!.length).to.not.be.null
      expect(info!.length).to.not.be.undefined
      expect(info!.length).to.be.greaterThanOrEqual(1)
    })

    it('consumer group has been created', async () => {
      const info = await xClient.infoGroups(streamName)
      expect(info).to.be.lengthOf(1)
      expect(info![0][1]).to.be.equal(groupName)
    })

    it('events can be read from the stream', async () => {
      const result = await xClient.read(streamName, {
        count: 10,
        block: 100,
        streamKey: '0',
      })
      expect(result).to.not.be.null
      expect(result).to.not.be.undefined
      expect(result?.length).to.be.greaterThanOrEqual(1)
      expect(result?.[0].id).to.not.be.undefined
      expect(result?.[0].message).to.not.be.undefined
      const parseJsonDataFn = () => JSON.parse(result![0].message.data)
      expect(parseJsonDataFn).to.not.throw
      const parsedXapiEvent = parseRawEvent(parseJsonDataFn())
      expect(parsedXapiEvent).to.not.be.undefined
    })

    it('events can be reverse range queried from the stream', async () => {
      const results = await redisClient.xrevrange(streamName, '+', '-')
      expect(results).to.not.be.null
      expect(results?.length).to.be.greaterThanOrEqual(1)
      expect(results?.[0][0]).to.not.be.undefined
      expect(results?.[0][0]).to.equal(entryId)
      expect(results?.[0][1]).to.not.be.undefined
      expect(results?.[0][1].length).to.be.eq(2)
      expect(results?.[0][1][1]).to.not.be.undefined
      const parseJsonDataFn = () => JSON.parse(results?.[0][1][1])
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
      const room = await entityManager.findOne(Room, 'room1', {})
      const userContentScores = (await room?.scores) || []
      const answers = (
        await Promise.all(
          userContentScores.map(
            async (userX) => (await userX.getAnswers()) || [],
          ),
        )
      ).flat()

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
    'Pushing multiple duplicate events to a Redis stream with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'
      const xapiEvent1 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user1')
        .withH5pId('h5p1')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse('')
        .withServerTimestamp(100000000000)
        .withClientTimestamp(100000000000)
      const xapiRecord1 = xapiEvent1.build()

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
        // push the same xapi event twice
        await xClient.add(streamName, event)
        await xClient.add(streamName, event)
        await xClient.add(streamName, event)
        await xClient.add(streamName, event)

        const state = {
          i: 0,
          delays: 0,
        }
        await simpleConsumerGroupWorkerLoop(
          xClient,
          streamName,
          errorStreamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
        )
      })

      after(async () => {
        await xClient.deleteGroup(streamName, groupName)
      })

      it('Idempotently processes the duplicate events and finds a single answer record', async () => {
        const room = await entityManager.findOne(Room, 'room1', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()

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
    },
  )

  context(
    'Pushing valid and invalid events to a Redis stream with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'

      // Valid
      const xapiEventValid1 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user1')
        .withH5pId('h5p1')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse('response')
        .withServerTimestamp(100000000000)
        .withClientTimestamp(100000000000)
      const xapiRecordValid1 = xapiEventValid1.build()

      // Valid => Score missing
      const xapiEventValid2 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user1')
        .withH5pId('h5p5')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore(undefined)
        .withResponse('response')
        .withServerTimestamp(100000000003)
        .withClientTimestamp(100000000003)
      const xapiRecordValid2 = xapiEventValid2.build()

      // Valid => Response Missing
      const xapiEventValid3 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user1')
        .withH5pId('h5p6')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse(undefined)
        .withServerTimestamp(100000000004)
        .withClientTimestamp(100000000004)
      const xapiRecordValid3 = xapiEventValid3.build()

      // invalid RoomId missing
      const xapiEventInvalid1 = new XApiRecordBuilder()
        .withRoomId(undefined)
        .withUserId('user1')
        .withH5pId('h5p2')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse('response')
        .withServerTimestamp(100000000001)
        .withClientTimestamp(100000000001)
      const xapiRecordInvalid1 = xapiEventInvalid1.build()

      // Invalid => UserId missing
      const xapiEventInvalid2 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId(undefined)
        .withH5pId('h5p3')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse('response')
        .withServerTimestamp(100000000002)
        .withClientTimestamp(100000000002)
      const xapiRecordInvalid2 = xapiEventInvalid2.build()

      // Invalid => H5pId missing
      const xapiEventInvalid3 = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user2')
        .withH5pId(undefined)
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore({ min: 0, max: 2, raw: 1 })
        .withResponse('response')
        .withServerTimestamp(100000000002)
        .withClientTimestamp(100000000002)
      const xapiRecordInvalid3 = xapiEventInvalid3.build()

      // Semi Invalid => Score + Response Missing
      // creates a UserContentScore, but not an Answer
      const xapiEventSemiValid = new XApiRecordBuilder()
        .withRoomId('room1')
        .withUserId('user1')
        .withH5pId('h5p7')
        .withH5pSubId(undefined)
        .withH5pName('h5pName')
        .withH5pType('h5pType')
        .withScore(undefined)
        .withResponse(undefined)
        .withServerTimestamp(100000000004)
        .withClientTimestamp(100000000004)
      const xapiRecordSemiValid = xapiEventSemiValid.build()

      before(async () => {
        // delete stream from redis
        await redisClient.del(streamName)

        // create redis consumer group after the stream gets created
        const onlyLatest = false
        await xClient.createGroup(streamName, groupName, onlyLatest)

        // push events to a new stream that gets created automatically
        const events = [
          xapiRecordValid1, // room + score + answer
          xapiRecordValid2, // room + score + answer
          xapiRecordValid3, // room + score + answer
          xapiRecordInvalid1, // no room
          xapiRecordInvalid2, // no room
          xapiRecordInvalid3, // no room
          xapiRecordSemiValid, // room + score, but no answer
        ].map((record) => ({
          data: JSON.stringify(record),
        }))
        const entryIds = await Promise.all(
          events.map(async (event) => {
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
          errorStreamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
        )
      })

      after(async () => {
        await xClient.deleteGroup(streamName, groupName)
      })

      it('creates userContentScores given valid index triplet (roomId, userId, ActivityId)', async () => {
        const room = await entityManager.findOne(Room, 'room1', {})
        const userContentScores = await room?.scores

        expect(room).to.not.be.undefined
        expect(userContentScores).to.not.be.undefined
        expect(userContentScores!.length).to.equal(4)
      })

      it('creates Answers only for events that have a valid Score or Response', async () => {
        const room = await entityManager.findOne(Room, 'room1', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()

        expect(room).to.not.be.undefined
        expect(answers.length).to.equal(3)
        const answer = answers[0]
        expect(answer).to.contain({
          roomId: 'room1',
          studentId: 'user1',
          contentKey: 'h5p1',
        })
      })

      // TODO: check if invalid events were put into error stream
    },
  )

  context(
    'Pushing 1 room, 1 user, 1 activity, 10 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 1,
        users: 1,
        activities: 1,
        events: 10,
        roomPrefix: '_test1_',
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
          errorStreamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
        )
      })

      after(async () => {
        await xClient.deleteGroup(streamName, groupName)
      })

      it('events can be read from the stream', async () => {
        const result = await xClient.read(streamName, {
          count: 10,
          block: 100,
          streamKey: '0',
        })
        expect(result).to.not.be.null
        expect(result?.length).to.equal(10)
        expect(result?.[0].id).to.not.be.undefined
        expect(result?.[0].message).to.not.be.undefined
        const parseJsonDataFn = () => JSON.parse(result![0].message.data)
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvent = parseRawEvent(parseJsonDataFn())
        expect(parsedXapiEvent).to.not.be.undefined
      })

      it('events can be reverse range queried from the stream', async () => {
        const results = await redisClient.xrevrange(streamName, '+', '-')
        expect(results).to.not.be.null
        expect(results?.length).to.be.equal(10)
        expect(results.map((x: any[]) => x[0])).to.have.members(entryIds)
        const parseJsonDataFn = () =>
          results.map((x: string[][]) => JSON.parse(x[1][1]))
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvents = parseJsonDataFn().map(
          (x: XApiRecord | undefined) => parseRawEvent(x),
        )
        expect(parsedXapiEvents.length).to.be.equal(10)
        expect(parsedXapiEvents.every((x: null) => x !== null)).to.be.true
      })

      it('processed events are found in the database', async () => {
        const room = await entityManager.findOne(Room, '_test1_room0', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()

        expect(room).to.not.be.undefined
        expect(userContentScores.length).to.equal(1)
        expect(answers.length).to.equal(10)
        const answer = answers[0]
        expect(answer).to.contain({
          roomId: '_test1_room0',
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
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 2,
        users: 2,
        activities: 2,
        events: 10,
        roomPrefix: '_test2_',
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
          errorStreamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
        )
      })

      after(async () => {
        await xClient.deleteGroup(streamName, groupName)
      })

      it('all xapiEvents have been pushed to the stream', async () => {
        expect(entryIds.length).to.equal(xapiRecords.length)
      })

      it('all pushed events can be reverse range queried from the stream', async () => {
        const results = await redisClient.xrevrange(streamName, '+', '-')
        expect(results).to.not.be.null
        expect(results?.length).to.be.equal(80)
        expect(results.map((x: any[]) => x[0])).to.have.members(entryIds)
        const parseJsonDataFn = () =>
          results.map((x: string[][]) => JSON.parse(x[1][1]))
        expect(parseJsonDataFn).to.not.throw
        const parsedXapiEvents = parseJsonDataFn().map(
          (x: XApiRecord | undefined) => parseRawEvent(x),
        )
        expect(parsedXapiEvents.length).to.be.equal(80)
      })

      it('room0 and its UsercontentScores and Answers are found in the database', async () => {
        const room0 = await entityManager.findOne(Room, '_test2_room0', {})
        const userContentScores0 = (await room0?.scores) || []
        const answers0 = (
          await Promise.all(
            userContentScores0.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()
        expect(room0).to.not.be.undefined
        expect(userContentScores0.length).to.equal(4)
        expect(answers0.length).to.equal(40)
      })

      it('room1 and its UsercontentScores and Answers are found in the database', async () => {
        const room1 = await entityManager.findOne(Room, '_test2_room1', {})
        const userContentScores1 = (await room1?.scores) || []
        const answers1 = (
          await Promise.all(
            userContentScores1.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
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
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 1,
        users: 1,
        activities: 1,
        events: 10,
        roomPrefix: '_test3_',
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
          errorStreamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
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
          errorStreamName,
          groupName,
          'consumer1',
          roomScoreProviderWorker,
          state,
        )
      })

      after(async () => {
        await xClient.deleteGroup(streamName, groupName)
      })

      it('all xapiEvents have been pushed to the stream', async () => {
        expect(entryIdsBatch1.length + entryIdsBatch2.length).to.equal(
          xapiRecords.length,
        )
      })

      it('all pushed events can be reverse range queried from the stream', async () => {
        const results = await redisClient.xrevrange(streamName, '+', '-')
        expect(results).to.not.be.null
        expect(results?.length).to.be.equal(10)
        expect(results.map((x: any[]) => x[0])).to.have.members([
          ...entryIdsBatch1,
          ...entryIdsBatch2,
        ])
      })

      it('room0 and its UsercontentScores and Answers are found in the database', async () => {
        const room = await entityManager.findOne(Room, '_test3_room0', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()

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
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'
      const xapiRecords = createXapiEvents({
        rooms: 2,
        users: 1,
        activities: 1,
        events: 10,
        roomPrefix: '_test4_',
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
            errorStreamName,
            groupName,
            'consumer1',
            roomScoreProviderWorker,
            state,
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
        const room = await entityManager.findOne(Room, '_test4_room0', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()
        expect(room).to.not.be.undefined
        expect(userContentScores.length).to.equal(1)
        expect(answers.length).to.equal(10)
      })

      it('room1 and its UsercontentScores and Answers are found in the database', async () => {
        const room = await entityManager.findOne(Room, '_test4_room1', {})
        const userContentScores = (await room?.scores) || []
        const answers = (
          await Promise.all(
            userContentScores.map(
              async (userX) => (await userX.getAnswers()) || [],
            ),
          )
        ).flat()
        expect(room).to.not.be.undefined
        expect(userContentScores.length).to.equal(1)
        expect(answers.length).to.equal(10)
      })
    },
  )

  context(
    'Pushing 10 rooms, 10 users, 10 activity, 10000 events with 1 Consumer',
    () => {
      const streamName = 'stream1'
      const errorStreamName = 'errorstream1'
      const groupName = 'group1'
      const numRooms = 3
      const numUsers = 3
      const numActivities = 3
      const numEvents = 10
      const xapiRecords = createXapiEvents({
        rooms: numRooms,
        users: numUsers,
        activities: numActivities,
        events: numEvents,
        roomPrefix: '_test5_',
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
            errorStreamName,
            groupName,
            'consumer1',
            roomScoreProviderWorker,
            state,
          )
          return entryIds
        }

        // loop
        const chunkSize = 42
        for (let idx = 0; idx < xapiRecords.length; idx += chunkSize) {
          const newEntryIds = await pushPullLoop(
            xapiRecords.slice(idx, idx + chunkSize),
          )
          entryIds = entryIds.concat(newEntryIds)
          state.i += 1
        }
      })

      after(async () => {
        await xClient.deleteGroup(streamName, groupName)
      })

      it('all xapiEvents have been pushed to the stream', async () => {
        expect(entryIds.length).to.equal(xapiRecords.length)
      })

      it('all rooms have are found in the database', async () => {
        const rooms = (await roomRepo.find()).filter((room) =>
          room.roomId.startsWith('_test5_'),
        )
        const userContentScores = (
          await Promise.all(
            rooms.map(async (room) => {
              const userXscores = (await room?.scores) || []
              return userXscores
            }),
          )
        ).flat()
        const answers = (
          await Promise.all(
            userContentScores.map(async (userX) => {
              return entityManager.find(Answer, {
                where: {
                  roomId: userX!.roomId,
                  studentId: userX!.studentId,
                  contentKey: userX!.contentKey,
                },
              })
            }),
          )
        ).flat()

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
