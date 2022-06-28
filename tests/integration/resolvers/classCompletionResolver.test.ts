import { getRepository } from 'typeorm'

import expect from '../../utils/chaiAsPromisedSetup'
import { TestTitle } from '../../utils/testTitles'
import '../../utils/globalIntegrationTestHooks'

import { dbConnect, dbDisconnect } from '../../utils/globalIntegrationTestHooks'
import { RoomBuilder, UserContentScoreBuilder } from '../../builders'
import { Room } from '../../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../../src/db/assessments/connectToAssessmentDatabase'
import ContentKey from '../../../src/helpers/contentKey'
import ClassCompletion from '../../../src/resolvers/classCompletion'

describe('classCompletionResolver.completionPercentages', () => {
  const roomRepo = () => getRepository(Room, ASSESSMENTS_CONNECTION_NAME)

  context(TestTitle.Authentication.context, () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      await dbConnect()
      const room = await new RoomBuilder().buildAndPersist()
      const rooms = await roomRepo().findByIds([room.roomId], {
        select: ['roomId'],
      })
      console.log(rooms)
    })

    after(async () => await dbDisconnect())
  })

  context(
    '1 room, 2 students, 1 h5p content, 1 non-h5p content, 4 UserContentScores; ' +
      '1 ucs.seen is false',
    () => {
      const roomId = 'room1'
      const student1Id = 'student1'
      const student2Id = 'student2'
      let result: number[]

      before(async () => {
        // Arrange
        await dbConnect()

        const h5pUcsBuilder = new UserContentScoreBuilder()
          .withH5pId('h5p1')
          .withH5pSubId(undefined)
          .withContentType('Flashcards')
          .withContentName('My H5P Content')
          .withContentKey(ContentKey.construct('content1', undefined))
        const student1UcsH5p = h5pUcsBuilder
          .withStudentId(student1Id)
          .withSeen(true)
          .build()
        const student2UcsH5p = h5pUcsBuilder
          .withStudentId(student2Id)
          .withSeen(false)
          .build()
        const nonH5pUcsBuilder = new UserContentScoreBuilder()
          .withH5pId(undefined)
          .withH5pSubId(undefined)
          .withContentType(undefined)
          .withContentName('My Non-H5P Content')
          .withContentKey(ContentKey.construct('content1', undefined))
        const student1UcsNonH5p = nonH5pUcsBuilder
          .withStudentId(student1Id)
          .withSeen(false)
          .build()
        const student2UcsNonH5p = nonH5pUcsBuilder
          .withStudentId(student2Id)
          .withSeen(false)
          .build()
        const room = await new RoomBuilder()
          .withRoomId(roomId)
          .withUcs([
            student1UcsH5p,
            student1UcsNonH5p,
            student2UcsH5p,
            student2UcsNonH5p,
          ])
          .buildAndPersist()

        const sut = new ClassCompletion(roomRepo())
        result = await sut.completionPercentages([roomId])
      })

      after(async () => await dbDisconnect())

      it('result has length of 1', () => {
        expect(result).to.have.lengthOf(1)
      })

      it('result[0] is 0.50', () => {
        expect(result[0]).to.equal(0.5)
      })
    },
  )
})
