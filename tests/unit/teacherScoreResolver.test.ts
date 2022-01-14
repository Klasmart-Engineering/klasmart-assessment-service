import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { EntityManager } from 'typeorm'
import { UserContentScore } from '../../src/db/assessments/entities'
import { UserProvider } from '../../src/providers/userProvider'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
import TeacherScoreResolver from '../../src/resolvers/teacherScore'
import {
  LessonMaterialBuilder,
  TeacherScoreBuilder,
  UserContentScoreBuilder,
} from '../builders'

describe('teacherScoreResolver.content', () => {
  context('contentName and contentType are undefined', () => {
    it('returns expected content', async () => {
      const content = new LessonMaterialBuilder().build()
      const userContentScore = new UserContentScoreBuilder()
        .withContentName(undefined)
        .withContentType(undefined)
        .withContentKey(content.contentId)
        .build()
      const teacherScore = new TeacherScoreBuilder(userContentScore).build()

      const userProvider = Substitute.for<UserProvider>()
      const assessmentDB = Substitute.for<EntityManager>()
      const cmsContentProvider = Substitute.for<CmsContentProvider>()

      assessmentDB
        .findOne(UserContentScore, {
          where: {
            roomId: teacherScore.roomId,
            studentId: teacherScore.studentId,
            contentKey: teacherScore.contentKey,
          },
        })
        .resolves(null)
      cmsContentProvider
        .getLessonMaterial(content.contentId, undefined)
        .resolves(content)

      const sut = new TeacherScoreResolver(
        userProvider,
        assessmentDB,
        cmsContentProvider,
      )

      // Act
      const resultContent = await sut.content(teacherScore, {})

      // Assert
      expect(resultContent).to.deep.include(content)
    })
  })
})
