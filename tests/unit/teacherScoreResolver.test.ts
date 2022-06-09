import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { EntityManager } from 'typeorm'
import ContentProvider from '../../src/helpers/getContent'
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

      const assessmentDB = Substitute.for<EntityManager>()
      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      const contentProvider = Substitute.for<ContentProvider>()

      contentProvider
        .getContent(
          teacherScore.contentKey,
          userContentScore.contentType,
          userContentScore.contentName,
          userContentScore.contentParentId,
          undefined,
        )
        .resolves(content)

      const sut = new TeacherScoreResolver(
        assessmentDB,
        cmsContentProvider,
        contentProvider,
      )

      // Act
      const resultContent = await sut.content(teacherScore, {})

      // Assert
      expect(resultContent).to.deep.include(content)
    })
  })
})
