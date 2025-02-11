import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { Repository } from 'typeorm'
import { LessonMaterialBuilder, UserContentScoreBuilder } from '../builders'
import { UserContentScore } from '../../src/db/assessments/entities'
import { RoomScoresTemplateProvider } from '../../src/providers/roomScoresTemplateProvider'
import { UserContentScoreFactory } from '../../src/providers/userContentScoreFactory'
import { ParsedXapiEvent } from '../../src/helpers/parsedXapiEvent'
import ContentKey from '../../src/helpers/contentKey'
import { FileType } from '../../src/db/cms/enums'
import { StudentContentsResult } from '../../src/providers/cmsContentProvider'

describe('roomScoresTemplateProvider', () => {
  describe('getTemplate', () => {
    context(
      "1 student, 1 h5p material with 'h5pSub1' sub-activity; 'h5pSub1' has 'h5pSub2' sub-activity; only 1 xAPI event which is for 'h5pSub2'; h5pRoot->h5pSub1->h5pSub2",
      () => {
        // Originally, sub-activities only generated a UserContentScore if an xAPI was received for it.
        // Because without a subcontent API, we can't know about it.
        // But now we use the fact that an xAPI event will include a parent ID if the activity
        // that generated the event is a sub-activity. So we now use that parent ID to generate a
        // UserContentScore for that parent, even though the parent may not emit an event.
        // Before the fix, this test returned 2 instead of 3.
        it('returns 3 UserContentScores', async () => {
          // Arrange
          const roomId = 'room1'
          const userId = 'user1'
          const teacherId = 'teacher1'
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
          const material = new LessonMaterialBuilder()
            .withSource(FileType.H5P, h5pRoot)
            .build()
          const materials: StudentContentsResult = {
            contents: new Map([[material.contentId, material]]),
            studentContentMap: [
              { studentId: userId, contentIds: [material.contentId] },
            ],
          }
          const xapiEvent: ParsedXapiEvent = {
            h5pId: h5pRoot,
            h5pSubId: h5pSub2,
            h5pParentId: h5pSub1,
            timestamp: 123,
            userId: userId,
          }
          const xapiEvents = [xapiEvent]

          const userContentScoreRepository =
            Substitute.for<Repository<UserContentScore>>()
          const userContentScoreFactory =
            Substitute.for<UserContentScoreFactory>()

          userContentScoreFactory
            .create(roomId, userId, userContentScore1.contentKey)
            .returns(userContentScore1)
          userContentScoreFactory
            .create(roomId, userId, userContentScore2.contentKey)
            .returns(userContentScore2)
          userContentScoreFactory
            .create(roomId, userId, userContentScore3.contentKey)
            .returns(userContentScore3)

          const sut = new RoomScoresTemplateProvider(
            userContentScoreRepository,
            userContentScoreFactory,
          )

          // Act
          const result = await sut.getTemplate(
            roomId,
            teacherId,
            materials,
            xapiEvents,
          )
          expect(result).to.have.lengthOf(3)
        })
      },
    )
  })
})
