import expect from '../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import RoomResolver from '../../src/resolvers/room'
import { EntityManager } from 'typeorm'
import { Attendance } from '../../src/db/users/entities'
import { Room } from '../../src/db/assessments/entities/room'
import { UserContentScore } from '../../src/db/assessments/entities/userContentScore'
import { RoomScoresCalculator } from '../../src/helpers/roomScoresCalculator'
import { TestTitle } from '../utils/testTitles'

describe('roomResolver', () => {
  context('queried room exists in database', () => {
    it('returns room with calculated scores', async () => {
      // Arrange
      const roomId = 'room1'
      const teacherId = 'teacher1'
      const studentId = 'student1'
      const contentId = 'content1'
      const scores = [new UserContentScore(roomId, studentId, contentId)]
      const room: Room = {
        room_id: roomId,
        recalculate: true,
        scores: Promise.resolve([]),
        teacherComments: Promise.resolve([]),
      }
      const attendance: Attendance = {
        sessionId: 'session1',
        userId: studentId,
        roomId: roomId,
        joinTimestamp: new Date(),
        leaveTimestamp: new Date(),
      }

      const userDB = Substitute.for<EntityManager>()
      const assessmentDB = Substitute.for<EntityManager>()
      const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()

      assessmentDB.findOne(Room, roomId, {}).resolves(room)
      userDB.find(Attendance, { where: { roomId } }).resolves([attendance])
      roomScoresCalculator.calculate(roomId, [attendance]).resolves(scores)

      const resolver = new RoomResolver(
        assessmentDB,
        userDB,
        roomScoresCalculator,
      )

      // Act
      const resultRoom = await resolver.Room(roomId, teacherId)

      // Assert
      assessmentDB.received(1).findOne(Room, roomId, {})
      userDB.received(1).find(Attendance, { where: { roomId } })
      roomScoresCalculator.received(1).calculate(roomId, [attendance])
      assessmentDB.received(1).save(room)
      const resultScores = await resultRoom.scores

      expect(resultScores).to.have.lengthOf(1)
      expect(resultRoom.recalculate).to.be.false
      expect(resultRoom.room_id).to.equal(roomId)
    })
  })

  context('queried room does not exist in database', () => {
    it('returns room with calculated scores', async () => {
      // Arrange
      const roomId = 'room1'
      const teacherId = 'teacher1'
      const studentId = 'student1'
      const contentId = 'content1'
      const scores = [new UserContentScore(roomId, studentId, contentId)]

      const attendance: Attendance = {
        sessionId: 'session1',
        userId: studentId,
        roomId: roomId,
        joinTimestamp: new Date(),
        leaveTimestamp: new Date(),
      }

      const userDB = Substitute.for<EntityManager>()
      const assessmentDB = Substitute.for<EntityManager>()
      const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()

      assessmentDB.findOne(Room, roomId, {}).resolves(undefined)
      userDB.find(Attendance, { where: { roomId } }).resolves([attendance])
      roomScoresCalculator.calculate(roomId, [attendance]).resolves(scores)

      const resolver = new RoomResolver(
        assessmentDB,
        userDB,
        roomScoresCalculator,
      )

      // Act
      const resultRoom = await resolver.Room(roomId, teacherId)

      // Assert
      assessmentDB.received(1).findOne(Room, roomId, {})
      userDB.received(1).find(Attendance, { where: { roomId } })
      roomScoresCalculator.received(1).calculate(roomId, [attendance])
      assessmentDB.received(1).save(resultRoom)
      const resultScores = await resultRoom.scores

      expect(resultScores).to.have.lengthOf(1)
      expect(resultRoom.recalculate).to.be.false
      expect(resultRoom.room_id).to.equal(roomId)
    })
  })
})
