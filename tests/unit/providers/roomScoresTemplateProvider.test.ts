import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { ContentBuilder, UserContentScoreBuilder } from '../../builders'
import { RoomScoresTemplateProvider } from '../../../src/providers/roomScoresTemplateProvider'
import ContentKey from '../../../src/helpers/contentKey'
import { FileType } from '../../../src/db/cms/enums'
import { StudentContentsResult } from '../../../src/providers/cmsContentProvider'
import { RoomMaterialsProvider } from '../../../src/providers/roomMaterialsProvider'

describe('roomScoresTemplateProvider', () => {
  describe('getTemplate', () => {
    // TODO: Not finished.
    context.skip(
      "1 student, 1 h5p material with 'h5pSub1' sub-activity; 'h5pSub1' has 'h5pSub2' sub-activity; only 1 xAPI event which is for 'h5pSub2'; h5pRoot->h5pSub1->h5pSub2",
      () => {
        it('returns 3 UserContentScores', async () => {
          // Arrange
          const roomId = 'room1'
          const userId = 'user1'
          const h5pRoot = 'h5pRoot'
          const h5pSub1 = 'h5pSub1' // child of h5pRoot
          const h5pSub2 = 'h5pSub2' // child of h5pSub1

          const userContentScore1 = new UserContentScoreBuilder()
            .withContentKey(ContentKey.construct(h5pRoot))
            .withroomId(roomId)
            .withStudentId(userId)
            .withContentParentId(undefined)
            .build()
          const userContentScore2 = new UserContentScoreBuilder()
            .withContentKey(ContentKey.construct(h5pRoot, h5pSub1))
            .withroomId(roomId)
            .withStudentId(userId)
            .withContentParentId(h5pRoot)
            .build()
          const userContentScore3 = new UserContentScoreBuilder()
            .withContentKey(ContentKey.construct(h5pRoot, h5pSub2))
            .withroomId(roomId)
            .withStudentId(userId)
            .withContentParentId(h5pSub1)
            .build()
          const material = new ContentBuilder()
            .withSource(FileType.H5P, h5pRoot)
            .build()
          // TODO: This needs to be fixed to reflect the above content scores.
          const studentContentsResult: StudentContentsResult = {
            contents: new Map([
              [material.contentId, { content: material, subContents: [] }],
            ]),
            studentContentMap: [
              { studentId: userId, contentIds: [material.contentId] },
            ],
          }
          const materialsProvider = Substitute.for<RoomMaterialsProvider>()
          materialsProvider
            .getMaterials(roomId, Arg.any())
            .resolves(studentContentsResult)

          const sut = new RoomScoresTemplateProvider(materialsProvider)

          // Act
          const result = await sut.getTemplates(roomId)

          // Assert
          expect(result).to.have.lengthOf(3)
        })
      },
    )
  })
})
