import expect from '../../utils/chaiAsPromisedSetup'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import RoomResolver from '../../../src/resolvers/room'
import { EntityManager } from 'typeorm'
import { Room } from '../../../src/db/assessments/entities/room'
import { UserContentScore } from '../../../src/db/assessments/entities/userContentScore'
import {
  RoomBuilder,
  TeacherCommentBuilder,
  UserContentScoreBuilder,
} from '../../builders'
import { RoomScoresTemplateProvider } from '../../../src/providers/roomScoresTemplateProvider'

describe('roomResolver', () => {
  describe('Room', () => {
    context('queried room exists in database', () => {
      it('returns room with calculated scores', async () => {
        // Arrange
        const roomId = 'room1'
        const teacherId = 'teacher1'
        const authenticationToken = undefined
        const scores = [
          new UserContentScoreBuilder().withroomId(roomId).build(),
        ]
        const room: Room = new RoomBuilder().withRoomId(roomId).build()
        room.scores = Promise.resolve(scores)
        room.teacherComments = Promise.resolve([])

        const assessmentDB = Substitute.for<EntityManager>()
        const roomScoresTemplateProvider =
          Substitute.for<RoomScoresTemplateProvider>()

        assessmentDB.findOne(Room, roomId).resolves(room)
        roomScoresTemplateProvider
          .getTemplates(roomId, authenticationToken)
          .resolves(scores)

        const sut = new RoomResolver(assessmentDB, roomScoresTemplateProvider)

        // Act
        const resultRoom = await sut.Room(roomId, {})

        // Assert
        assessmentDB.received(1).findOne(Room, roomId)
        roomScoresTemplateProvider.received(0).getTemplates(roomId, undefined)
        assessmentDB.received(1).save(room)
        const resultScores = await resultRoom.scores

        expect(resultScores).to.have.lengthOf(1)
        expect(resultRoom.roomId).to.equal(roomId)
      })
    })

    context('queried room does not exist in database', () => {
      it('returns room with calculated scores', async () => {
        // Arrange
        const roomId = 'room1'
        const teacherId = 'teacher1'
        const studentId = 'student1'
        const contentId = 'content1'
        const authenticationToken = undefined
        const scores = [UserContentScore.new(roomId, studentId, contentId)]

        const assessmentDB = Substitute.for<EntityManager>()
        const roomScoresTemplateProvider =
          Substitute.for<RoomScoresTemplateProvider>()

        assessmentDB.findOne(Room, roomId).resolves(undefined)
        roomScoresTemplateProvider
          .getTemplates(roomId, authenticationToken)
          .resolves(scores)

        const resolver = new RoomResolver(
          assessmentDB,
          roomScoresTemplateProvider,
        )

        // Act
        const resultRoom = await resolver.Room(roomId, {})

        // Assert
        assessmentDB.received(1).findOne(Room, roomId)
        roomScoresTemplateProvider
          .received(1)
          .getTemplates(roomId, authenticationToken)
        assessmentDB.received(1).save(resultRoom)
        const resultScores = await resultRoom.scores

        expect(resultScores).to.have.lengthOf(1)
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
        const room: Room = new RoomBuilder().withRoomId(roomId).build()
        room.scores = Promise.resolve([])
        room.teacherComments = Promise.resolve([comment1, comment2])

        // Act
        const results = await room.teacherCommentsByStudent()

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
        const room: Room = new RoomBuilder().withRoomId(roomId).build()
        room.scores = Promise.resolve([userContentScore1, userContentScore2])
        room.teacherComments = Promise.resolve([])

        // Act
        const results = await room.scoresByUser()

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
        const room: Room = new RoomBuilder().withRoomId(roomId).build()
        room.scores = Promise.resolve([userContentScore1, userContentScore2])
        room.teacherComments = Promise.resolve([])

        // Act
        const results = await room.scoresByContent()

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
          const room: Room = new RoomBuilder().withRoomId(roomId).build()
          room.scores = Promise.resolve([
            student1UserContentScore,
            student2UserContentScore1,
            student2UserContentScore2,
          ])
          room.teacherComments = Promise.resolve([])

          // Act
          const results = await room.scoresByContent()

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
