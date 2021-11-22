import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { EntityManager, Repository } from 'typeorm'
import { UserContentScore } from '../../src/db/assessments/entities'
import { Content } from '../../src/db/cms/entities'
import { UserProvider } from '../../src/helpers/userProvider'
import TeacherScoreResolver from '../../src/resolvers/teacherScore'
import {
  LessonMaterialBuilder,
  TeacherScoreBuilder,
  UserContentScoreBuilder,
} from '../builders'

describe('teacherScoreResolver.content', () => {
  context('contentName and contentType are undefined', () => {
    it('', async () => {
      const content = new LessonMaterialBuilder().build()
      const userContentScore = new UserContentScoreBuilder()
        .withContentName(undefined)
        .withContentType(undefined)
        .withContentKey(content.contentId)
        .build()
      const teacherScore = new TeacherScoreBuilder(userContentScore).build()

      const userProvider = Substitute.for<UserProvider>()
      const assessmentDB = Substitute.for<EntityManager>()
      const contentRepository = Substitute.for<Repository<Content>>()

      assessmentDB
        .findOne(UserContentScore, {
          where: {
            roomId: teacherScore.roomId,
            studentId: teacherScore.studentId,
            contentKey: teacherScore.contentKey,
          },
        })
        .resolves(null)

      const sut = new TeacherScoreResolver(
        userProvider,
        assessmentDB,
        contentRepository,
      )

      // Act
      const resultContent = await sut.content(teacherScore)

      // Assert
      expect(resultContent).to.not.be.undefined
    })
  })
})
