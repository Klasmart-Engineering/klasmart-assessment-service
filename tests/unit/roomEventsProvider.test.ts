import { expect } from 'chai'
import { v4 } from 'uuid'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { RoomEventsProvider } from '../../src/providers/roomEventsProvider'
import { AttendanceBuilder, XApiRecordBuilder } from '../builders'
import { IXApiRepository } from '../../src/db/xapi/repo'

describe('roomEventsProvider', () => {
  context(
    '1 attendance, 1 xapi event, but event clientTimestamp is undefined',
    () => {
      it('returns empty list of xapi events', async () => {
        // Arrange
        const roomId = 'room1'
        const studentId = 'student1'
        const h5pId = v4()

        const attendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(studentId)
          .build()
        const xapiRecord = new XApiRecordBuilder()
          .withH5pId(h5pId)
          .withUserId(studentId)
          .withClientTimestamp(undefined)
          .build()
        const h5pIdToContentIdMap = new Map<string, string>([
          [h5pId, 'content1'],
        ])

        const xapiRepository = Substitute.for<IXApiRepository>()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers([studentId], Arg.any(), Arg.any())
          .resolves([xapiRecord])

        const roomEventsProvider = new RoomEventsProvider(xapiRepository)

        // Act
        const resultEvents = await roomEventsProvider.getEvents(
          roomId,
          [attendance],
          h5pIdToContentIdMap,
        )

        // Assert
        expect(resultEvents).to.be.empty
      })
    },
  )

  context(
    '1 attendance, 2 xapi events. ' +
      'event1: h5p1; event2: h5p1.subA' +
      'h5p.h5pType = Flashcards; h5p1.subA.h5pType = undefined',
    () => {
      it('h5p1.subA.h5pType equals Flashcards', async () => {
        // Arrange
        const roomId = 'room1'
        const studentId = 'student1'
        const h5pId = v4()
        const h5pSubId = v4()
        const h5pType = 'Flashcards'

        const attendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(studentId)
          .build()
        const xapiRecord = new XApiRecordBuilder()
          .withH5pId(h5pId)
          .withUserId(studentId)
          .withH5pType('Flashcards')
          .build()
        const xapiRecord2 = new XApiRecordBuilder()
          .withH5pId(h5pId)
          .withUserId(studentId)
          .withH5pSubId(h5pSubId)
          .withH5pType(undefined)
          .build()
        const h5pIdToContentIdMap = new Map<string, string>([
          [h5pId, 'content1'],
        ])

        const xapiRepository = Substitute.for<IXApiRepository>()
        xapiRepository
          .searchXapiEventsWithRoomId(roomId)
          .resolves([xapiRecord, xapiRecord2])

        const sut = new RoomEventsProvider(xapiRepository)

        // Act
        const resultEvents = await sut.getEvents(
          roomId,
          [attendance],
          h5pIdToContentIdMap,
        )

        // Assert
        expect(resultEvents).to.have.lengthOf(2)
        expect(resultEvents[0].h5pType).to.equal(h5pType)
        expect(resultEvents[1].h5pType).to.equal(h5pType)
      })
    },
  )

  context(
    '1 attendance, 3 xapi events. ' +
      'event1: h5p1; event2: h5p1.subA; event3: h5p1.subA.subB' +
      'h5p.h5pType = Flashcards; h5p1.subA.h5pType = undefined; h5p1.subA.subB.h5pType = undefined',
    () => {
      it('h5p1.subA.h5pType and h5p1.subA.subB.h5pType both equal Flashcards', async () => {
        // Arrange
        const roomId = 'room1'
        const studentId = 'student1'
        const h5pId = v4()
        const xapi2SubId = v4()
        const xapi3SubId = v4()
        const h5pType = 'Flashcards'

        const attendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(studentId)
          .build()
        const xapiRecord1 = new XApiRecordBuilder()
          .withH5pId(h5pId)
          .withUserId(studentId)
          .withH5pType('Flashcards')
          .build()
        const xapiRecord2 = new XApiRecordBuilder()
          .withH5pId(h5pId)
          .withUserId(studentId)
          .withH5pSubId(xapi2SubId)
          .withH5pType(undefined)
          .build()
        const xapiRecord3 = new XApiRecordBuilder()
          .withH5pId(h5pId)
          .withUserId(studentId)
          .withH5pSubId(xapi3SubId)
          .withH5pParentId(xapi2SubId)
          .withH5pType(undefined)
          .build()
        const h5pIdToContentIdMap = new Map<string, string>([
          [h5pId, 'content1'],
        ])

        const xapiRepository = Substitute.for<IXApiRepository>()
        xapiRepository
          .searchXapiEventsWithRoomId(roomId)
          .resolves([xapiRecord1, xapiRecord2, xapiRecord3])

        const sut = new RoomEventsProvider(xapiRepository)

        // Act
        const resultEvents = await sut.getEvents(
          roomId,
          [attendance],
          h5pIdToContentIdMap,
        )

        // Assert
        expect(resultEvents).to.have.lengthOf(3)
        expect(resultEvents[0].h5pType).to.equal(h5pType)
        expect(resultEvents[1].h5pType).to.equal(h5pType)
        expect(resultEvents[2].h5pType).to.equal(h5pType)
      })
    },
  )
})
