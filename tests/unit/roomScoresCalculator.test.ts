import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { RoomScoresCalculator } from '../../src/helpers/roomScoresCalculator'
import { RoomAttendanceProvider } from '../../src/helpers/roomAttendanceProvider'
import { RoomMaterialsProvider } from '../../src/helpers/roomMaterialsProvider'
import { RoomEventsProvider } from '../../src/helpers/roomEventsProvider'
import { RoomScoresTemplateProvider } from '../../src/helpers/roomScoresTemplateProvider'
import {
  AttendanceBuilder,
  LessonMaterialBuilder,
  UserContentScoreBuilder,
} from '../builders'
import { ParsedXapiEvent } from '../../src/helpers/parsedXapiEvent'
import { UserContentScore } from '../../src/db/assessments/entities'
import { v4 } from 'uuid'
import { FileType } from '../../src/db/cms/enums'
import { FindConditions } from 'typeorm'

describe('roomScoresCalculator', () => {
  context('1 attendance with 1 xapi event', () => {
    it('returns 1 UserContentScore', async () => {
      // Arrange
      const roomId = 'room1'
      const teacherId = 'teacher1'
      const studentId = 'student1'
      const h5pId = v4()
      const mapKeyToUserContentScoreMap = new Map<string, UserContentScore>()

      const attendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(studentId)
        .build()
      const material = new LessonMaterialBuilder()
        .withSource(FileType.H5P, h5pId)
        .build()
      const xapiRecord: ParsedXapiEvent = {
        userId: studentId,
        h5pId: h5pId,
        timestamp: Date.now(),
        verb: 'answered',
        score: { min: 0, max: 2, raw: 1, scaled: 0.5 },
      }
      const userContentScore = new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(studentId)
        .withContentKey(material.contentId)
        .build()
      mapKeyToUserContentScoreMap.set(
        RoomScoresTemplateProvider.getMapKey(
          roomId,
          studentId,
          material.contentId,
        ),
        userContentScore,
      )

      const attendanceProvider = Substitute.for<RoomAttendanceProvider>()
      const eventsProvider = Substitute.for<RoomEventsProvider>()
      const materialsProvider = Substitute.for<RoomMaterialsProvider>()
      const scoresTemplateProvider = Substitute.for<RoomScoresTemplateProvider>()

      attendanceProvider.getAttendances(roomId).resolves([attendance])
      materialsProvider.getMaterials(roomId).resolves([material])
      eventsProvider.getEvents(roomId, [attendance]).resolves([xapiRecord])
      scoresTemplateProvider
        .getCompatContentKey(material.contentId, material.h5pId, undefined)
        .resolves(material.contentId)
      scoresTemplateProvider
        .getTemplate(roomId, teacherId, [material], [attendance], [xapiRecord])
        .resolves(mapKeyToUserContentScoreMap)

      const roomsScoresCalculator = new RoomScoresCalculator(
        attendanceProvider,
        eventsProvider,
        materialsProvider,
        scoresTemplateProvider,
      )

      // Act
      const resultScores = await roomsScoresCalculator.calculate(
        roomId,
        teacherId,
      )

      // Assert
      expect(resultScores).to.have.lengthOf(1)

      const expected: FindConditions<UserContentScore> = {
        roomId: roomId,
        studentId: studentId,
        contentKey: material.contentId,
        seen: true,
        min: 0,
        max: 2,
        scoreFrequency: 1,
        sum: 1,
        contentName: undefined,
        contentType: undefined,
      }
      expect(resultScores[0]).to.deep.include(expected)
      const answers = await resultScores[0].answers
      expect(answers).to.have.lengthOf(1)

      // TODO: Add checks for answers and scoreSummary.
    })
  })

  context(
    '1 attendance, 1 xapi event with a user id that does not match',
    () => {
      it('returns 1 UserContentScore with no answers', async () => {
        // Arrange
        const roomId = 'room1'
        const teacherId = 'teacher1'
        const studentId = 'student1'
        const idOfSomeOtherUser = v4()
        const h5pId = v4()
        const mapKeyToUserContentScoreMap = new Map<string, UserContentScore>()

        const attendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(studentId)
          .build()
        const material = new LessonMaterialBuilder()
          .withSource(FileType.H5P, h5pId)
          .build()
        const xapiRecord: ParsedXapiEvent = {
          userId: idOfSomeOtherUser,
          h5pId: h5pId,
          timestamp: Date.now(),
          verb: 'answered',
          score: { min: 0, max: 2, raw: 1, scaled: 0.5 },
        }
        const userContentScore = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(studentId)
          .withContentKey(material.contentId)
          .build()
        mapKeyToUserContentScoreMap.set(
          RoomScoresTemplateProvider.getMapKey(
            roomId,
            studentId,
            material.contentId,
          ),
          userContentScore,
        )

        const attendanceProvider = Substitute.for<RoomAttendanceProvider>()
        const eventsProvider = Substitute.for<RoomEventsProvider>()
        const materialsProvider = Substitute.for<RoomMaterialsProvider>()
        const scoresTemplateProvider = Substitute.for<RoomScoresTemplateProvider>()

        attendanceProvider.getAttendances(roomId).resolves([attendance])
        materialsProvider.getMaterials(roomId).resolves([material])
        eventsProvider.getEvents(roomId, [attendance]).resolves([xapiRecord])
        scoresTemplateProvider
          .getCompatContentKey(material.contentId, material.h5pId, undefined)
          .resolves(material.contentId)
        scoresTemplateProvider
          .getTemplate(
            roomId,
            teacherId,
            [material],
            [attendance],
            [xapiRecord],
          )
          .resolves(mapKeyToUserContentScoreMap)

        const roomsScoresCalculator = new RoomScoresCalculator(
          attendanceProvider,
          eventsProvider,
          materialsProvider,
          scoresTemplateProvider,
        )

        // Act
        const resultScores = await roomsScoresCalculator.calculate(
          roomId,
          teacherId,
        )

        // Assert
        expect(resultScores).to.have.lengthOf(1)

        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: studentId,
          contentKey: material.contentId,
          seen: false,
          scoreFrequency: 0,
          sum: 0,
          contentName: undefined,
          contentType: undefined,
        }
        expect(resultScores[0]).to.deep.include(expected)
        const answers = await resultScores[0].answers
        expect(answers).to.be.empty
      })
    },
  )
})
