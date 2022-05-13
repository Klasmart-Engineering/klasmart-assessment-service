import { expect } from 'chai'
import { v4 } from 'uuid'
import { AttendanceBuilder, XApiSqlRecordBuilder } from '../builders'
import { XApiRecord } from '../../src/db/xapi'
import { XApiSqlRepository } from '../../src/db/xapi/sql/repo'
import { createXApiDbConnection } from '../utils/testConnection'
import { Connection } from 'typeorm'
import { XApiRecordSql } from '../../src/db/xapi/sql/entities'
import { RoomEventsProvider } from '../../src/providers/roomEventsProvider'

describe('xApi SQL database interface', () => {
  context('1 student, 1 xapi "score" event', () => {
    let dbConnection: Connection
    let xapiRecord: XApiRecordSql
    let xapiRecords: ReadonlyArray<XApiRecord>
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const score = { min: 0, max: 2, raw: 1 }
    const studentId = v4()
    const lessonMaterialH5pId = v4()

    before(async () => {
      // Arrange
      dbConnection = await createXApiDbConnection()
      xapiRecord = await new XApiSqlRecordBuilder()
        .withUserId(studentId)
        .withH5pId(lessonMaterialH5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .buildAndPersist()

      const typeOrmRepository = dbConnection.getRepository(XApiRecordSql)
      const sut = new XApiSqlRepository(typeOrmRepository)
      xapiRecords = await sut.groupSearchXApiEventsForUsers([studentId])
    })

    after(async () => await dbConnection?.close())

    it('returns xapiRecords with length of 1', async () => {
      expect(xapiRecords).to.not.be.null
      expect(xapiRecords).to.not.be.undefined
      expect(xapiRecords).to.have.lengthOf(1)
    })

    it('returns expected xapiRecord.userId', async () => {
      const actual = xapiRecords?.[0]?.userId
      expect(actual).to.deep.equal(studentId)
    })
  })

  // query by room -> for 2 users create 3 rooms and check that events belong to the right room
  context(
    '2 rooms, 2 students, 4 xapi "score" events that do NOT overlap',
    () => {
      let dbConnection: Connection
      let xapiRecord_11: XApiRecordSql
      let xapiRecord_12: XApiRecordSql
      let xapiRecord_21: XApiRecordSql
      let xapiRecord_22: XApiRecordSql
      let xapiRecordWithRoomIdOne: ReadonlyArray<XApiRecord>
      let xapiRecordWithRoomIdTwo: ReadonlyArray<XApiRecord>
      let xapiRecordWithGroupedUsersAndTimestampsOne: ReadonlyArray<XApiRecord>
      let xapiRecordWithGroupedUsersAndTimestampsTwo: ReadonlyArray<XApiRecord>
      let xapiRecordsWithEventProviderRoomOne: ReadonlyArray<XApiRecord>
      let xapiRecordsWithEventProviderRoomTwo: ReadonlyArray<XApiRecord>
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'
      const score = { min: 0, max: 2, raw: 1 }
      const roomOneId = v4()
      const roomTwoId = v4()
      const studentOneId = v4()
      const studentTwoId = v4()
      const lessonMaterialH5pId = v4()

      const roomOneStart = new Date('01 Jan 2022 13:00:00 UTC')
      const roomOneEnd = new Date('01 Jan 2022 14:00:00 UTC')
      const roomTwoStart = new Date('01 Jan 2022 15:00:00 UTC')
      const roomTwoEnd = new Date('01 Jan 2022 16:00:00 UTC')

      before(async () => {
        // Arrange
        dbConnection = await createXApiDbConnection()
        xapiRecord_11 = await new XApiSqlRecordBuilder()
          .withRoomId(roomOneId)
          .withUserId(studentOneId)
          .withServerTimestamp(Date.parse('01 Jan 2022 13:10:00 UTC'))
          .withH5pId(lessonMaterialH5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore(score)
          .withResponse(undefined)
          .buildAndPersist()
        xapiRecord_12 = await new XApiSqlRecordBuilder()
          .withRoomId(roomOneId)
          .withUserId(studentTwoId)
          .withServerTimestamp(Date.parse('01 Jan 2022 13:20:00 UTC'))
          .withH5pId(lessonMaterialH5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore(score)
          .withResponse(undefined)
          .buildAndPersist()
        xapiRecord_21 = await new XApiSqlRecordBuilder()
          .withRoomId(roomTwoId)
          .withUserId(studentOneId)
          .withServerTimestamp(Date.parse('01 Jan 2022 15:10:00 UTC'))
          .withH5pId(lessonMaterialH5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore(score)
          .withResponse(undefined)
          .buildAndPersist()
        xapiRecord_22 = await new XApiSqlRecordBuilder()
          .withRoomId(roomTwoId)
          .withUserId(studentTwoId)
          .withServerTimestamp(Date.parse('01 Jan 2022 15:20:00 UTC'))
          .withH5pId(lessonMaterialH5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore(score)
          .withResponse(undefined)
          .buildAndPersist()

        const attendance_11 = new AttendanceBuilder()
          .withroomId(roomOneId)
          .withUserId(studentOneId)
          .withPeriod(roomOneStart, roomOneEnd)
          .build()
        const attendance_12 = new AttendanceBuilder()
          .withroomId(roomOneId)
          .withUserId(studentTwoId)
          .withPeriod(roomOneStart, roomOneEnd)
          .build()
        const attendance_21 = new AttendanceBuilder()
          .withroomId(roomTwoId)
          .withUserId(studentOneId)
          .withPeriod(roomTwoStart, roomTwoEnd)
          .build()
        const attendance_22 = new AttendanceBuilder()
          .withroomId(roomTwoId)
          .withUserId(studentTwoId)
          .withPeriod(roomTwoStart, roomTwoEnd)
          .build()

        const h5pIdToContentIdMap = new Map<string, string>([
          [lessonMaterialH5pId, 'content1'],
        ])

        const typeOrmRepository = dbConnection.getRepository(XApiRecordSql)
        const sut = new XApiSqlRepository(typeOrmRepository)
        xapiRecordWithRoomIdOne = await sut.searchXapiEventsWithRoomId(
          roomOneId,
        )
        xapiRecordWithRoomIdTwo = await sut.searchXapiEventsWithRoomId(
          roomTwoId,
        )
        xapiRecordWithGroupedUsersAndTimestampsOne =
          await sut.groupSearchXApiEventsForUsers(
            [studentOneId, studentTwoId],
            roomOneStart.getTime(),
            roomOneEnd.getTime(),
          )
        xapiRecordWithGroupedUsersAndTimestampsTwo =
          await sut.groupSearchXApiEventsForUsers(
            [studentOneId, studentTwoId],
            roomTwoStart.getTime(),
            roomTwoEnd.getTime(),
          )

        const roomEventsProvider = new RoomEventsProvider(sut)
        xapiRecordsWithEventProviderRoomOne =
          await roomEventsProvider.getEvents(
            roomOneId,
            [attendance_11, attendance_12],
            h5pIdToContentIdMap,
          )
        xapiRecordsWithEventProviderRoomTwo =
          await roomEventsProvider.getEvents(
            roomTwoId,
            [attendance_21, attendance_22],
            h5pIdToContentIdMap,
          )
      })

      after(async () => await dbConnection?.close())

      it('searchXapiEventsWithRoomId returns xapiRecords with length of 2', async () => {
        expect(xapiRecordWithRoomIdOne).to.have.lengthOf(2)
        expect(xapiRecordWithRoomIdTwo).to.have.lengthOf(2)
      })

      it('groupSearchXApiEventsForUsers returns xapiRecords with length of 2', async () => {
        expect(xapiRecordWithGroupedUsersAndTimestampsOne).to.have.lengthOf(2)
        expect(xapiRecordWithGroupedUsersAndTimestampsTwo).to.have.lengthOf(2)
      })

      it('roomEventsProvider.getEvents returns xapiRecords with length of 2', async () => {
        expect(xapiRecordsWithEventProviderRoomOne).to.have.lengthOf(2)
        expect(xapiRecordsWithEventProviderRoomTwo).to.have.lengthOf(2)
      })

      it('searchXapiEventsWithRoomId returns the right events ', async () => {
        const e11 = xapiRecordWithRoomIdOne[0]
        const e12 = xapiRecordWithRoomIdOne[1]
        const e21 = xapiRecordWithRoomIdTwo[0]
        const e22 = xapiRecordWithRoomIdTwo[1]

        expect([e11.userId, e12.userId]).to.have.members([
          studentOneId,
          studentTwoId,
        ])
        expect([e21.userId, e22.userId]).to.have.members([
          studentOneId,
          studentTwoId,
        ])

        expect(e11.roomId).to.deep.equal(xapiRecord_11.roomId)
        expect(e12.roomId).to.deep.equal(xapiRecord_11.roomId)
        expect(e21.roomId).to.deep.equal(xapiRecord_21.roomId)
        expect(e22.roomId).to.deep.equal(xapiRecord_21.roomId)
      })

      it('groupSearchXApiEventsForUsers returns the right events ', async () => {
        const e11 = xapiRecordWithGroupedUsersAndTimestampsOne[0]
        const e12 = xapiRecordWithGroupedUsersAndTimestampsOne[1]
        const e21 = xapiRecordWithGroupedUsersAndTimestampsTwo[0]
        const e22 = xapiRecordWithGroupedUsersAndTimestampsTwo[1]

        expect([e11.userId, e12.userId]).to.have.members([
          studentOneId,
          studentTwoId,
        ])
        expect([e21.userId, e22.userId]).to.have.members([
          studentOneId,
          studentTwoId,
        ])

        expect(e11.roomId).to.deep.equal(xapiRecord_11.roomId)
        expect(e12.roomId).to.deep.equal(xapiRecord_11.roomId)
        expect(e21.roomId).to.deep.equal(xapiRecord_21.roomId)
        expect(e22.roomId).to.deep.equal(xapiRecord_21.roomId)
      })

      it('roomEventsProvider.getEvents returns the right events ', async () => {
        console.log(
          JSON.stringify(xapiRecordsWithEventProviderRoomOne, null, 2),
        )
        console.log(
          JSON.stringify(xapiRecordsWithEventProviderRoomTwo, null, 2),
        )
        const e11 = xapiRecordsWithEventProviderRoomOne[0]
        const e12 = xapiRecordsWithEventProviderRoomOne[1]
        const e21 = xapiRecordsWithEventProviderRoomTwo[0]
        const e22 = xapiRecordsWithEventProviderRoomTwo[1]

        expect([e11.userId, e12.userId]).to.have.members([
          studentOneId,
          studentTwoId,
        ])
        expect([e21.userId, e22.userId]).to.have.members([
          studentOneId,
          studentTwoId,
        ])

        expect(e11.roomId).to.deep.equal(xapiRecord_11.roomId)
        expect(e12.roomId).to.deep.equal(xapiRecord_11.roomId)
        expect(e21.roomId).to.deep.equal(xapiRecord_21.roomId)
        expect(e22.roomId).to.deep.equal(xapiRecord_21.roomId)
      })
    },
  )

  context('2 rooms, 2 students, 4 xapi "score" events that overlap', () => {
    let dbConnection: Connection
    let xapiRecord_11: XApiRecordSql
    let xapiRecord_12: XApiRecordSql
    let xapiRecord_21: XApiRecordSql
    let xapiRecord_22: XApiRecordSql
    let xapiRecordWithRoomIdOne: ReadonlyArray<XApiRecord>
    let xapiRecordWithRoomIdTwo: ReadonlyArray<XApiRecord>
    let xapiRecordWithGroupedUsersAndTimestampsOne: ReadonlyArray<XApiRecord>
    let xapiRecordWithGroupedUsersAndTimestampsTwo: ReadonlyArray<XApiRecord>
    let xapiRecordsWithEventProviderRoomOne: ReadonlyArray<XApiRecord>
    let xapiRecordsWithEventProviderRoomTwo: ReadonlyArray<XApiRecord>
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const score = { min: 0, max: 2, raw: 1 }
    const roomOneId = v4()
    const roomTwoId = v4()
    const studentOneId = v4()
    const studentTwoId = v4()
    const lessonMaterialH5pId = v4()

    const roomOneStart = new Date('01 Jan 2022 13:00:00 UTC')
    const roomOneEnd = new Date('01 Jan 2022 14:00:00 UTC')
    const roomTwoStart = new Date('01 Jan 2022 12:00:00 UTC')
    const roomTwoEnd = new Date('01 Jan 2022 16:00:00 UTC')

    before(async () => {
      // Arrange
      dbConnection = await createXApiDbConnection()
      xapiRecord_11 = await new XApiSqlRecordBuilder()
        .withRoomId(roomOneId)
        .withUserId(studentOneId)
        .withServerTimestamp(Date.parse('01 Jan 2022 13:10:00 UTC'))
        .withH5pId(lessonMaterialH5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .buildAndPersist()
      xapiRecord_12 = await new XApiSqlRecordBuilder()
        .withRoomId(roomOneId)
        .withUserId(studentTwoId)
        .withServerTimestamp(Date.parse('01 Jan 2022 13:20:00 UTC'))
        .withH5pId(lessonMaterialH5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .buildAndPersist()
      xapiRecord_21 = await new XApiSqlRecordBuilder()
        .withRoomId(roomTwoId)
        .withUserId(studentOneId)
        .withServerTimestamp(Date.parse('01 Jan 2022 13:11:00 UTC'))
        .withH5pId(lessonMaterialH5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .buildAndPersist()
      xapiRecord_22 = await new XApiSqlRecordBuilder()
        .withRoomId(roomTwoId)
        .withUserId(studentTwoId)
        .withServerTimestamp(Date.parse('01 Jan 2022 13:22:00 UTC'))
        .withH5pId(lessonMaterialH5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .buildAndPersist()

      const attendance_11 = new AttendanceBuilder()
        .withroomId(roomOneId)
        .withUserId(studentOneId)
        .withPeriod(roomOneStart, roomOneEnd)
        .build()
      const attendance_12 = new AttendanceBuilder()
        .withroomId(roomOneId)
        .withUserId(studentTwoId)
        .withPeriod(roomOneStart, roomOneEnd)
        .build()
      const attendance_21 = new AttendanceBuilder()
        .withroomId(roomTwoId)
        .withUserId(studentOneId)
        .withPeriod(roomTwoStart, roomTwoEnd)
        .build()
      const attendance_22 = new AttendanceBuilder()
        .withroomId(roomTwoId)
        .withUserId(studentTwoId)
        .withPeriod(roomTwoStart, roomTwoEnd)
        .build()

      const h5pIdToContentIdMap = new Map<string, string>([
        [lessonMaterialH5pId, 'content1'],
      ])

      const typeOrmRepository = dbConnection.getRepository(XApiRecordSql)
      const sut = new XApiSqlRepository(typeOrmRepository)
      xapiRecordWithRoomIdOne = await sut.searchXapiEventsWithRoomId(roomOneId)
      xapiRecordWithRoomIdTwo = await sut.searchXapiEventsWithRoomId(roomTwoId)
      xapiRecordWithGroupedUsersAndTimestampsOne =
        await sut.groupSearchXApiEventsForUsers(
          [studentOneId, studentTwoId],
          roomOneStart.getTime(),
          roomOneEnd.getTime(),
        )
      xapiRecordWithGroupedUsersAndTimestampsTwo =
        await sut.groupSearchXApiEventsForUsers(
          [studentOneId, studentTwoId],
          roomTwoStart.getTime(),
          roomTwoEnd.getTime(),
        )

      const roomEventsProvider = new RoomEventsProvider(sut)
      xapiRecordsWithEventProviderRoomOne = await roomEventsProvider.getEvents(
        roomOneId,
        [attendance_11, attendance_12],
        h5pIdToContentIdMap,
      )
      xapiRecordsWithEventProviderRoomTwo = await roomEventsProvider.getEvents(
        roomTwoId,
        [attendance_21, attendance_22],
        h5pIdToContentIdMap,
      )
    })

    after(async () => await dbConnection?.close())

    it('searchXapiEventsWithRoomId returns xapiRecords with length of 2', async () => {
      expect(xapiRecordWithRoomIdOne).to.have.lengthOf(2)
      expect(xapiRecordWithRoomIdTwo).to.have.lengthOf(2)
    })

    it('groupSearchXApiEventsForUsers for room 1 returns xapiRecords 4 records (2 should be filtered)', async () => {
      expect(xapiRecordWithGroupedUsersAndTimestampsOne).to.have.lengthOf(4)
    })
    it('groupSearchXApiEventsForUsers for room 1 returns xapiRecords 4 records (2 should be filtered)', async () => {
      expect(xapiRecordWithGroupedUsersAndTimestampsTwo).to.have.lengthOf(4)
    })

    it('roomEventsProvider.getEvents returns xapiRecords with length of 2', async () => {
      expect(xapiRecordsWithEventProviderRoomOne).to.have.lengthOf(2)
      expect(xapiRecordsWithEventProviderRoomTwo).to.have.lengthOf(2)
    })

    it('searchXapiEventsWithRoomId returns the right events ', async () => {
      const e11 = xapiRecordWithRoomIdOne[0]
      const e12 = xapiRecordWithRoomIdOne[1]
      const e21 = xapiRecordWithRoomIdTwo[0]
      const e22 = xapiRecordWithRoomIdTwo[1]

      expect([e11.userId, e12.userId]).to.have.members([
        studentOneId,
        studentTwoId,
      ])
      expect([e21.userId, e22.userId]).to.have.members([
        studentOneId,
        studentTwoId,
      ])

      expect(e11.roomId).to.deep.equal(xapiRecord_11.roomId)
      expect(e12.roomId).to.deep.equal(xapiRecord_11.roomId)
      expect(e21.roomId).to.deep.equal(xapiRecord_21.roomId)
      expect(e22.roomId).to.deep.equal(xapiRecord_21.roomId)
    })

    it('roomEventsProvider.getEvents returns the right events ', async () => {
      console.log(JSON.stringify(xapiRecordsWithEventProviderRoomOne, null, 2))
      console.log(JSON.stringify(xapiRecordsWithEventProviderRoomTwo, null, 2))
      const e11 = xapiRecordsWithEventProviderRoomOne[0]
      const e12 = xapiRecordsWithEventProviderRoomOne[1]
      const e21 = xapiRecordsWithEventProviderRoomTwo[0]
      const e22 = xapiRecordsWithEventProviderRoomTwo[1]

      expect([e11.userId, e12.userId]).to.have.members([
        studentOneId,
        studentTwoId,
      ])
      expect([e21.userId, e22.userId]).to.have.members([
        studentOneId,
        studentTwoId,
      ])

      expect(e11.roomId).to.deep.equal(xapiRecord_11.roomId)
      expect(e12.roomId).to.deep.equal(xapiRecord_11.roomId)
      expect(e21.roomId).to.deep.equal(xapiRecord_21.roomId)
      expect(e22.roomId).to.deep.equal(xapiRecord_21.roomId)
    })
  })
  // query by group of userIds -> for 2 users create events with and without a roomId but with timestamps that coincide in time
  //
  //
  //
  //
  //
})
