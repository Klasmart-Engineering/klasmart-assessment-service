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
import ContentKey from '../../src/helpers/contentKey'
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
import { throwExpression } from '../utils/throwExpression'

describe('migrateContentIdColumnsToUseContentIdInsteadOfH5pId', function () {
  const contentKeyRelationColumnName = 'userContentScoreContentKey'

  before(async () => await dbConnect())
  after(async () => await dbDisconnect())
  afterEach(async () => await dbSynchronize())

  context('contentId columns are set as h5pId, schedule not found', () => {
    it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are not modified', async () => {
      // Arrange
      const roomId = 'room1'
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentKey).to.equal(lessonMaterial.h5pId)
      expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
      expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

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
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${lessonMaterial.h5pId}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${lessonMaterial.h5pId}'`)
        .getOneOrFail()
    })
  })

  context('contentId columns are set as h5pId, lesson plan not found', () => {
    it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are not modified', async () => {
      // Arrange
      const roomId = 'room1'
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .buildAndPersist()
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentKey).to.equal(lessonMaterial.h5pId)
      expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
      expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

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
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${lessonMaterial.h5pId}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${lessonMaterial.h5pId}'`)
        .getOneOrFail()
    })
  })

  context(
    'contentId columns are set as contentId, material h5p id is undefined',
    () => {
      it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are not modified', async () => {
        // Arrange
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder()
          .withUndefinedH5pId()
          .buildAndPersist()
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
          .withContentKey(lessonMaterial.contentId) // content ID is currently set as the h5p ID.
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
        const teacherScore = await new TeacherScoreBuilder(
          userContentScore,
        ).buildAndPersist()

        expect(userContentScore.contentKey).to.equal(lessonMaterial.contentId)
        expect(answer.contentKey).to.equal(lessonMaterial.contentId)
        expect(teacherScore.contentKey).to.equal(lessonMaterial.contentId)

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
            contentKey: lessonMaterial.contentId, // should not change
          },
        })

        const dbTeacherScore = await getRepository(
          TeacherScore,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // should not change
          },
        })

        const dbAnswer = await getRepository(
          Answer,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // should not change
          },
        })

        await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()

        await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()
      })
    },
  )

  context(
    'contentId columns are set as h5pId, but material is not included in the lesson plan',
    () => {
      it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are set to contentId', async () => {
        // Arrange
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder().buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
        const teacherScore = await new TeacherScoreBuilder(
          userContentScore,
        ).buildAndPersist()

        expect(userContentScore.contentKey).to.equal(lessonMaterial.h5pId)
        expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
        expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

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
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbTeacherScore = await getRepository(
          TeacherScore,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbAnswer = await getRepository(
          Answer,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()

        await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()
      })
    },
  )

  context(
    'contentId columns are set as h5pId, but material is not included in the lesson plan, publish status is "hidden"',
    () => {
      it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are set to contentId', async () => {
        // Arrange
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder()
          .withPublishStatus('hidden')
          .buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder().buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
        const teacherScore = await new TeacherScoreBuilder(
          userContentScore,
        ).buildAndPersist()

        expect(userContentScore.contentKey).to.equal(lessonMaterial.h5pId)
        expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
        expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

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
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbTeacherScore = await getRepository(
          TeacherScore,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbAnswer = await getRepository(
          Answer,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()

        await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()
      })
    },
  )

  context('contentId columns are set as h5pId, read-only run', () => {
    it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are not modified', async () => {
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
        .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentKey).to.equal(lessonMaterial.h5pId)
      expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
      expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

      // Act
      await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
        getConnection(CMS_CONNECTION_NAME),
        getConnection(ASSESSMENTS_CONNECTION_NAME),
        true,
      )

      // Assert
      const dbUserContentScore = await getRepository(
        UserContentScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should not change
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${lessonMaterial.h5pId}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${lessonMaterial.h5pId}'`)
        .getOneOrFail()
    })
  })

  context(
    'contentId columns are set as h5pId, 2 content scores with same room id',
    () => {
      it('contentId columns for tables (UserContentScore, TeacherScore, Answer) are set to contentId', async () => {
        // Arrange
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const student2 = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        const userContentScore1 = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
          .buildAndPersist()
        const userContentScore2 = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student2.userId)
          .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore1,
        ).buildAndPersist()
        const teacherScore = await new TeacherScoreBuilder(
          userContentScore1,
        ).buildAndPersist()

        expect(userContentScore1.contentKey).to.equal(lessonMaterial.h5pId)
        expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
        expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

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
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbUserContentScore2 = await getRepository(
          UserContentScore,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student2.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbTeacherScore = await getRepository(
          TeacherScore,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        const dbAnswer = await getRepository(
          Answer,
          ASSESSMENTS_CONNECTION_NAME,
        ).findOneOrFail({
          where: {
            roomId: roomId,
            studentId: student.userId,
            contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
          },
        })

        await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()

        await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
          .createQueryBuilder()
          .where(
            `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
          )
          .getOneOrFail()
      })
    },
  )

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
        .withContentKey(lessonMaterial.h5pId) // content ID is currently set as the h5p ID.
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentKey).to.equal(lessonMaterial.h5pId)
      expect(answer.contentKey).to.equal(lessonMaterial.h5pId)
      expect(teacherScore.contentKey).to.equal(lessonMaterial.h5pId)

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
          contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId, // now it should be set as the cms content ID
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(
          `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
        )
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(
          `"${contentKeyRelationColumnName}" = '${lessonMaterial.contentId}'`,
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
      const oldContentKey = ContentKey.construct(
        lessonMaterial.h5pId ?? throwExpression('h5pId cannot be undefined'),
        lessonMaterial.subcontentId,
      )
      const newContentKey = ContentKey.construct(
        lessonMaterial.contentId,
        lessonMaterial.subcontentId,
      )

      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentKey(oldContentKey)
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentKey).to.equal(oldContentKey)
      expect(answer.contentKey).to.equal(oldContentKey)
      expect(teacherScore.contentKey).to.equal(oldContentKey)

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
          contentKey: newContentKey, // now it should be set as contentId|subcontentId
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: newContentKey, // now it should be set as contentId|subcontentId
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: newContentKey, // now it should be set as the contentId|subcontentId
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${newContentKey}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${newContentKey}'`)
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

      const contentKey = ContentKey.construct(
        lessonMaterial.contentId,
        lessonMaterial.subcontentId,
      )

      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentKey(contentKey)
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      expect(userContentScore.contentKey).to.equal(contentKey)
      expect(answer.contentKey).to.equal(contentKey)
      expect(teacherScore.contentKey).to.equal(contentKey)

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
          contentKey: contentKey, // should not change
        },
      })

      const dbTeacherScore = await getRepository(
        TeacherScore,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: contentKey, // should not change
        },
      })

      const dbAnswer = await getRepository(
        Answer,
        ASSESSMENTS_CONNECTION_NAME,
      ).findOneOrFail({
        where: {
          roomId: roomId,
          studentId: student.userId,
          contentKey: contentKey, // should not change
        },
      })

      await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${contentKey}'`)
        .getOneOrFail()

      await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
        .createQueryBuilder()
        .where(`"${contentKeyRelationColumnName}" = '${contentKey}'`)
        .getOneOrFail()
    })
  })
})
