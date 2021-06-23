// import { expect } from 'chai'
// import { Arg, Substitute } from '@fluffy-spoon/substitute'
// import { Attendance } from '../../src/db/users/entities'
// import { XAPIRecord, XAPIRepository } from '../../src/db/xapi/repo'
// import { RoomScoresCalculator } from '../../src/helpers/roomScoresCalculator'
// import { Repository } from 'typeorm'
// import { Content } from '../../src/db/cms/entities'

// describe('roomScoresCalculator', () => {
//   context('one attendance with one xapi event', () => {
//     it('returns one UserContentScore', async () => {
//       // Arrange
//       const roomId = 'room1'
//       const studentId = 'student1'
//       const sessionId = 'session1'

//       const attendance: Attendance = {
//         sessionId: sessionId,
//         userId: studentId,
//         roomId: roomId,
//         joinTimestamp: new Date(),
//         leaveTimestamp: new Date(),
//       }
//       const xAPIRecord: XAPIRecord = {
//         userId: studentId,
//         serverTimestamp: Date.now(),
//         xapi: {},
//       }

//       const xapiRepository = Substitute.for<XAPIRepository>()
//       const contentRepository = Substitute.for<Repository<Content>>()

//       xapiRepository
//         .searchXApiEvents(studentId, Arg.any(), Arg.any())
//         .resolves([xAPIRecord])

//       contentRepository.find(Arg.any()).resolves([xAPIRecord])

//       const roomsScoresCalculator = new RoomScoresCalculator(
//         xapiRepository,
//         contentRepository,
//       )

//       // Act
//       const resultScores = await roomsScoresCalculator.calculate(roomId, [
//         attendance,
//       ])

//       // Assert
//       expect(resultScores).to.have.lengthOf(1)
//     })
//   })
// })
