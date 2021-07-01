import { expect } from 'chai'
import { getConnection, getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import {
  Answer,
  TeacherScore,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
import { migrateContentIdColumnsToUseContentIdInsteadOfH5pId } from '../../src/helpers/migrateContentIdColumnsToUseContentIdInsteadOfH5pId'
import {
  AnswerBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
  TeacherScoreBuilder,
  UserBuilder,
  UserContentScoreBuilder,
} from '../builders'
import {
  dbConnect,
  dbDisconnect,
  dbSynchronize,
} from '../utils/globalIntegrationTestHooks'

describe('migrateContentIdColumnsToUseContentIdInsteadOfH5pId', function () {
  const fullContentIdRelationColumnName = 'userContentScoreContentId'

  before(async () => await dbConnect())
  after(async () => await dbDisconnect())
  afterEach(async () => await dbSynchronize())

  context('contentId columns are set as h5pId', () => {
    it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are set to contentId', async () => {
      // Arrange
      const roomId = 'room1'
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withFullContentId(lessonMaterial.h5pId!) // content ID is currently set as the h5p ID.
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentId).to.equal(lessonMaterial.h5pId)
      expect(answer.fullContentId).to.equal(lessonMaterial.h5pId)
      expect(teacherScore.fullContentId).to.equal(lessonMaterial.h5pId)

      // Act
      await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
        getConnection(CMS_CONNECTION_NAME),
        getConnection(ASSESSMENTS_CONNECTION_NAME),
        false,
      )

      // Assert
      const dbUserContentScore = await getRepository(
        UserContentScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentId: lessonMaterial.contentId, // now it should be set as the cms content ID
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          fullContentId: lessonMaterial.contentId, // now it should be set as the cms content ID
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          fullContentId: lessonMaterial.contentId, // now it should be set as the cms content ID
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(
          `"${fullContentIdRelationColumnName}" = '${lessonMaterial.contentId}'`,
        )
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(
          `"${fullContentIdRelationColumnName}" = '${lessonMaterial.contentId}'`,
        )
        .getOneOrFail()
    })
  })

  context('contentId columns are set as h5pId|subcontentId', () => {
    it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are set to contentId|subcontentId', async () => {
      // Arrange
      const roomId = 'room1'
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder()
        .withSubcontentId(v4())
        .buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()

      // The content id column is currently set as h5pId|subcontentId.
      const oldContentId = `${lessonMaterial.h5pId}|${lessonMaterial.subcontentId}`
      const newContentId = `${lessonMaterial.contentId}|${lessonMaterial.subcontentId}`

      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withFullContentId(oldContentId)
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentId).to.equal(oldContentId)
      expect(answer.fullContentId).to.equal(oldContentId)
      expect(teacherScore.fullContentId).to.equal(oldContentId)

      // Act
      await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
        getConnection(CMS_CONNECTION_NAME),
        getConnection(ASSESSMENTS_CONNECTION_NAME),
        false,
      )

      // Assert
      const dbUserContentScore = await getRepository(
        UserContentScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentId: newContentId, // now it should be set as contentId|subcontentId
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          fullContentId: newContentId, // now it should be set as contentId|subcontentId
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          fullContentId: newContentId, // now it should be set as the contentId|subcontentId
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${fullContentIdRelationColumnName}" = '${newContentId}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${fullContentIdRelationColumnName}" = '${newContentId}'`)
        .getOneOrFail()
    })
  })

  context('contentId columns are set as contentId|subcontentId', () => {
    it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are not modified', async () => {
      // Arrange
      const roomId = 'room1'
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder()
        .withSubcontentId(v4())
        .buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()

      const fullContentId = `${lessonMaterial.contentId}|${lessonMaterial.subcontentId}`

      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withFullContentId(fullContentId)
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentId).to.equal(fullContentId)
      expect(answer.fullContentId).to.equal(fullContentId)
      expect(teacherScore.fullContentId).to.equal(fullContentId)

      // Act
      await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
        getConnection(CMS_CONNECTION_NAME),
        getConnection(ASSESSMENTS_CONNECTION_NAME),
        false,
      )

      // Assert
      const dbUserContentScore = await getRepository(
        UserContentScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentId: fullContentId, // should not change
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          fullContentId: fullContentId, // should not change
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          fullContentId: fullContentId, // should not change
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${fullContentIdRelationColumnName}" = '${fullContentId}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${fullContentIdRelationColumnName}" = '${fullContentId}'`)
        .getOneOrFail()
    })
  })
})
