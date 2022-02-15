import expect from '../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import RoomResolver from '../../src/resolvers/room'
import { EntityManager } from 'typeorm'
import { Room } from '../../src/db/assessments/entities/room'
import { UserContentScore } from '../../src/db/assessments/entities/userContentScore'
import { RoomScoresCalculator } from '../../src/providers/roomScoresCalculator'
import {
  AttendanceBuilder,
  TeacherCommentBuilder,
  UserContentScoreBuilder,
} from '../builders'
import { RoomAttendanceProvider } from '../../src/providers/roomAttendanceProvider'

describe('roomResolver', () => {
  describe('Room', () => {
    context(
      'queried room exists in database; room.attendanceCount is 1; ' +
        'room.attendanceCount matches actual attendance count',
      () => {
        it('returns room with calculated scores', async () => {
          // Arrange
          const roomId = 'room1'
          const teacherId = 'teacher1'
          const authenticationToken = undefined
          const scores = [
            new UserContentScoreBuilder().withroomId(roomId).build(),
          ]
          const attendance = new AttendanceBuilder().build()
          const attendances = [attendance]
          const room: Room = new Room(roomId)
          room.scores = Promise.resolve(scores)
          room.attendanceCount = 1
          room.teacherComments = Promise.resolve([])

          const assessmentDB = Substitute.for<EntityManager>()
          const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
          const roomAttendanceProvider =
            Substitute.for<RoomAttendanceProvider>()

          assessmentDB.findOne(Room, roomId, {}).resolves(room)
          roomScoresCalculator
            .calculate(roomId, teacherId, attendances, authenticationToken)
            .resolves(scores)
          roomAttendanceProvider.getAttendances(roomId).resolves(attendances)

          const sut = new RoomResolver(
            assessmentDB,
            roomScoresCalculator,
            roomAttendanceProvider,
          )

          // Act
          const resultRoom = await sut.Room(roomId, teacherId, {})

          // Assert
          assessmentDB.received(1).findOne(Room, roomId, {})
          roomScoresCalculator
            .received(0)
            .calculate(roomId, teacherId, attendances)
          assessmentDB.received(0).save(room)
          const resultScores = await resultRoom.scores

          expect(resultScores).to.have.lengthOf(1)
          expect(resultRoom.attendanceCount).to.equal(1)
          expect(resultRoom.roomId).to.equal(roomId)
        })
      },
    )

    context(
      'queried room exists in database; room.attendanceCount is 0; ' +
        'room.attendanceCount does not match actual attendance count',
      () => {
        it('returns room with calculated scores', async () => {
          // Arrange
          const roomId = 'room1'
          const teacherId = 'teacher1'
          const authenticationToken = undefined
          const scores = [
            new UserContentScoreBuilder().withroomId(roomId).build(),
          ]
          const attendance = new AttendanceBuilder().build()
          const attendances = [attendance]
          const room: Room = new Room(roomId)
          room.scores = Promise.resolve(scores)
          room.attendanceCount = 0
          room.teacherComments = Promise.resolve([])

          const assessmentDB = Substitute.for<EntityManager>()
          const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
          const roomAttendanceProvider =
            Substitute.for<RoomAttendanceProvider>()

          assessmentDB.findOne(Room, roomId, {}).resolves(room)
          roomScoresCalculator
            .calculate(roomId, teacherId, attendances, authenticationToken)
            .resolves(scores)
          roomAttendanceProvider.getAttendances(roomId).resolves(attendances)

          const sut = new RoomResolver(
            assessmentDB,
            roomScoresCalculator,
            roomAttendanceProvider,
          )

          // Act
          const resultRoom = await sut.Room(roomId, teacherId, {})

          // Assert
          assessmentDB.received(1).findOne(Room, roomId, {})
          roomScoresCalculator
            .received(1)
            .calculate(roomId, teacherId, attendances, authenticationToken)
          assessmentDB.received(1).save(room)
          const resultScores = await resultRoom.scores

          expect(resultScores).to.have.lengthOf(1)
          expect(resultRoom.attendanceCount).to.equal(1)
          expect(resultRoom.roomId).to.equal(roomId)
          expect(resultRoom.attendanceCount).to.equal(1)
        })
      },
    )

    context('queried room does not exist in database', () => {
      it('returns room with calculated scores', async () => {
        // Arrange
        const roomId = 'room1'
        const teacherId = 'teacher1'
        const studentId = 'student1'
        const contentId = 'content1'
        const authenticationToken = undefined
        const scores = [new UserContentScore(roomId, studentId, contentId)]
        const attendance = new AttendanceBuilder().build()
        const attendances = [attendance]

        const assessmentDB = Substitute.for<EntityManager>()
        const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
        const roomAttendanceProvider = Substitute.for<RoomAttendanceProvider>()

        assessmentDB.findOne(Room, roomId, {}).resolves(undefined)
        roomScoresCalculator
          .calculate(roomId, teacherId, attendances, authenticationToken)
          .resolves(scores)
        roomAttendanceProvider.getAttendances(roomId).resolves(attendances)

        const resolver = new RoomResolver(
          assessmentDB,
          roomScoresCalculator,
          roomAttendanceProvider,
        )

        // Act
        const resultRoom = await resolver.Room(roomId, teacherId, {})

        // Assert
        assessmentDB.received(1).findOne(Room, roomId, {})
        roomScoresCalculator
          .received(1)
          .calculate(roomId, teacherId, attendances, authenticationToken)
        assessmentDB.received(1).save(resultRoom)
        const resultScores = await resultRoom.scores

        expect(resultScores).to.have.lengthOf(1)
        expect(resultRoom.attendanceCount).to.equal(1)
        expect(resultRoom.roomId).to.equal(roomId)
      })
    })
  })

  describe('teacherCommentsByStudent', () => {
    context('1 student, 2 TeacherComments', () => {
      it('returns 2 comments grouped under student', async () => {
        // Arrange
        const roomId = 'room1'
        const studentId = 'student1'
        const comment1 = new TeacherCommentBuilder()
          .withRoomId(roomId)
          .withStudentId(studentId)
          .withComment('comment 1')
          .build()
        const comment2 = new TeacherCommentBuilder()
          .withRoomId(roomId)
          .withStudentId(studentId)
          .withComment('comment 2')
          .build()
        const room: Room = new Room(roomId)
        room.scores = Promise.resolve([])
        room.teacherComments = Promise.resolve([comment1, comment2])

        const assessmentDB = Substitute.for<EntityManager>()
        const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
        const roomAttendanceProvider = Substitute.for<RoomAttendanceProvider>()

        const sut = new RoomResolver(
          assessmentDB,
          roomScoresCalculator,
          roomAttendanceProvider,
        )

        // Act
        const results = await sut.teacherCommentsByStudent(room)

        // Assert
        expect(results).to.have.lengthOf(1)
        expect(results[0].studentId).to.equal(studentId)
        expect(results[0].teacherComments).to.deep.equal([comment1, comment2])
      })
    })
  })

  describe('scoresByUser', () => {
    context('1 student, 2 UserContentScores', () => {
      it('returns 2 UserContentScores grouped under student', async () => {
        // Arrange
        const roomId = 'room1'
        const studentId = 'student1'
        const contentKey1 = 'content1'
        const contentKey2 = 'content2'
        const userContentScore1 = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(studentId)
          .withContentKey(contentKey1)
          .build()
        const userContentScore2 = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(studentId)
          .withContentKey(contentKey2)
          .build()
        const room: Room = new Room(roomId)
        room.scores = Promise.resolve([userContentScore1, userContentScore2])
        room.teacherComments = Promise.resolve([])

        const assessmentDB = Substitute.for<EntityManager>()
        const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
        const roomAttendanceProvider = Substitute.for<RoomAttendanceProvider>()

        const sut = new RoomResolver(
          assessmentDB,
          roomScoresCalculator,
          roomAttendanceProvider,
        )

        // Act
        const results = await sut.scoresByUser(room)

        // Assert
        expect(results).to.have.lengthOf(1)
        expect(results[0].userId).to.equal(studentId)
        expect(results[0].scores).to.deep.equal([
          userContentScore1,
          userContentScore2,
        ])
      })
    })
  })

  describe('scoresByContent', () => {
    context('1 student, 2 UserContentScores for different content', () => {
      it('returns 1 UserContentScore grouped under each content', async () => {
        // Arrange
        const roomId = 'room1'
        const studentId = 'student1'
        const userContentScore1 = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(studentId)
          .build()
        const userContentScore2 = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(studentId)
          .build()
        const room: Room = new Room(roomId)
        room.scores = Promise.resolve([userContentScore1, userContentScore2])
        room.teacherComments = Promise.resolve([])

        const assessmentDB = Substitute.for<EntityManager>()
        const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
        const roomAttendanceProvider = Substitute.for<RoomAttendanceProvider>()

        const sut = new RoomResolver(
          assessmentDB,
          roomScoresCalculator,
          roomAttendanceProvider,
        )

        // Act
        const results = await sut.scoresByContent(room)

        // Assert
        expect(results).to.have.lengthOf(2)
        expect(results[0].contentKey).to.equal(userContentScore1.contentKey)
        expect(results[0].scores).to.deep.equal([userContentScore1])
        expect(results[1].contentKey).to.equal(userContentScore2.contentKey)
        expect(results[1].scores).to.deep.equal([userContentScore2])
      })
    })

    context(
      'student1 1 UserContentScore for contentA; student2 1 UserContentScore for contentA, 1 for contentB',
      () => {
        it('returns 2 UserContentScores grouped under contentA, and 1 grouped under contentB', async () => {
          // Arrange
          const roomId = 'room1'
          const student1Id = 'student1'
          const student2Id = 'student2'
          const contentKeyA = 'contentA'
          const contentKeyB = 'contentB'
          const student1UserContentScore = new UserContentScoreBuilder()
            .withroomId(roomId)
            .withStudentId(student1Id)
            .withContentKey(contentKeyA)
            .build()
          const student2UserContentScore1 = new UserContentScoreBuilder()
            .withroomId(roomId)
            .withStudentId(student2Id)
            .withContentKey(contentKeyA)
            .build()
          const student2UserContentScore2 = new UserContentScoreBuilder()
            .withroomId(roomId)
            .withStudentId(student2Id)
            .withContentKey(contentKeyB)
            .build()
          const room: Room = new Room(roomId)
          room.scores = Promise.resolve([
            student1UserContentScore,
            student2UserContentScore1,
            student2UserContentScore2,
          ])
          room.teacherComments = Promise.resolve([])

          const assessmentDB = Substitute.for<EntityManager>()
          const roomScoresCalculator = Substitute.for<RoomScoresCalculator>()
          const roomAttendanceProvider =
            Substitute.for<RoomAttendanceProvider>()

          const sut = new RoomResolver(
            assessmentDB,
            roomScoresCalculator,
            roomAttendanceProvider,
          )

          // Act
          const results = await sut.scoresByContent(room)

          // Assert
          expect(results).to.have.lengthOf(2)
          expect(results[0].contentKey).to.equal(contentKeyA)
          expect(results[0].scores).to.deep.equal([
            student1UserContentScore,
            student2UserContentScore1,
          ])
          expect(results[1].contentKey).to.equal(
            student2UserContentScore2.contentKey,
          )
          expect(results[1].scores).to.deep.equal([student2UserContentScore2])
        })
      },
    )
  })
})
