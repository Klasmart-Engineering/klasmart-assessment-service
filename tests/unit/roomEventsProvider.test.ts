import { expect } from 'chai'
import { v4 } from 'uuid'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { RoomEventsProvider } from '../../src/helpers/roomEventsProvider'
import { AttendanceBuilder, XApiRecordBuilder } from '../builders'
import { XApiRepository } from '../../src/db/xapi/repo'

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

        const xapiRepository = Substitute.for<XApiRepository>()
        xapiRepository
          .searchXApiEvents(studentId, Arg.any(), Arg.any())
          .resolves([xapiRecord])

        const roomEventsProvider = new RoomEventsProvider(xapiRepository)

        // Act
        const resultEvents = await roomEventsProvider.getEvents(roomId, [
          attendance,
        ])

        // Assert
        expect(resultEvents).to.be.empty
      })
    },
  )
})
