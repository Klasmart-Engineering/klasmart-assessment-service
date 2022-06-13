import 'reflect-metadata'
import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { RoomScoresCalculator } from '../../../src/providers/roomScoresCalculator'
import { RoomMaterialsProvider } from '../../../src/providers/roomMaterialsProvider'
import { RoomScoresTemplateProvider } from '../../../src/providers/roomScoresTemplateProvider'
import { LessonMaterialBuilder, UserContentScoreBuilder } from '../../builders'
import { ParsedXapiEvent } from '../../../src/helpers/parsedXapiEvent'
import { UserContentScore } from '../../../src/db/assessments/entities'
import { v4 } from 'uuid'
import { FileType } from '../../../src/db/cms/enums'
import { FindConditions } from 'typeorm'
import { StudentContentsResult } from '../../../src/providers/cmsContentProvider'

describe('roomScoresCalculator', () => {
  // TODO: Scores are no longer calculated in roomScoresCalculator.
  context.skip('1 attendance with 1 xapi event', () => {
    it('returns 1 UserContentScore', async () => {
      // Arrange
      const roomId = 'room1'
      const studentId = 'student1'
      const h5pId = v4()
      const mapKeyToUserContentScoreMap = new Map<string, UserContentScore>()

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
      const authenticationToken = undefined

      const materialsProvider = Substitute.for<RoomMaterialsProvider>()
      const scoresTemplateProvider =
        Substitute.for<RoomScoresTemplateProvider>()

      const studentContentsResult: StudentContentsResult = {
        contents: new Map([
          [material.contentId, { content: material, subContents: [] }],
        ]),
        studentContentMap: [{ studentId, contentIds: [material.contentId] }],
      }
      materialsProvider
        .getMaterials(roomId, authenticationToken)
        .resolves(studentContentsResult)
      scoresTemplateProvider
        .getCompatContentKey(
          roomId,
          studentId,
          material.contentId,
          material.h5pId,
          undefined,
        )
        .resolves(material.contentId)
      scoresTemplateProvider
        .getTemplate(roomId, studentContentsResult)
        .resolves(mapKeyToUserContentScoreMap)

      const roomsScoresCalculator = new RoomScoresCalculator(
        materialsProvider,
        scoresTemplateProvider,
      )

      // Act
      const resultScores = await roomsScoresCalculator.calculate(
        roomId,
        authenticationToken,
      )

      // Assert
      expect(resultScores).to.have.lengthOf(1, 'resultScores')

      const expected: FindConditions<UserContentScore> = {
        roomId: roomId,
        studentId: studentId,
        contentKey: material.contentId,
        seen: true,
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
        const studentId = 'student1'
        const idOfSomeOtherUser = v4()
        const h5pId = v4()
        const mapKeyToUserContentScoreMap = new Map<string, UserContentScore>()

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
        const authenticationToken = undefined

        const materialsProvider = Substitute.for<RoomMaterialsProvider>()
        const roomScoresTemplateProvider =
          Substitute.for<RoomScoresTemplateProvider>()

        const studentContentsResult: StudentContentsResult = {
          contents: new Map([
            [material.contentId, { content: material, subContents: [] }],
          ]),
          studentContentMap: [{ studentId, contentIds: [material.contentId] }],
        }
        materialsProvider
          .getMaterials(roomId, authenticationToken)
          .resolves(studentContentsResult)
        roomScoresTemplateProvider
          .getCompatContentKey(
            roomId,
            idOfSomeOtherUser,
            material.contentId,
            material.h5pId,
            undefined,
          )
          .resolves(material.contentId)
        roomScoresTemplateProvider
          .getTemplate(roomId, studentContentsResult)
          .resolves(mapKeyToUserContentScoreMap)

        const roomsScoresCalculator = new RoomScoresCalculator(
          materialsProvider,
          roomScoresTemplateProvider,
        )

        // Act
        const resultScores = await roomsScoresCalculator.calculate(
          roomId,
          authenticationToken,
        )

        // Assert
        expect(resultScores).to.have.lengthOf(1)

        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: studentId,
          contentKey: material.contentId,
          seen: false,
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
