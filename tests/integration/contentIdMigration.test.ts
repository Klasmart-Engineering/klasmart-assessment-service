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
import { migrateContentIdColumnsToUseContentIdInsteadOfH5pId } from '../../src/migrateContentIdColumnsToUseContentIdInsteadOfH5pId'
import {
  AnswerBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
  TeacherScoreBuilder,
  UserBuilder,
  UserContentScoreBuilder,
} from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'

describe('migrateContentIdColumnsToUseContentIdInsteadOfH5pId', function () {
  after(async () => await dbDisconnect())

  it('full content id does not include a subcontent id', async () => {
    // Arrange
    await dbConnect()
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
      .withContentId(lessonMaterial.h5pId!) // content ID is currently set as the h5p ID.
      .buildAndPersist()
    const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
    const teacherScore = await new TeacherScoreBuilder(
      userContentScore,
    ).buildAndPersist()

    expect(userContentScore.contentId).to.equal(lessonMaterial.h5pId)
    expect(answer.contentId).to.equal(lessonMaterial.h5pId)
    expect(teacherScore.contentId).to.equal(lessonMaterial.h5pId)

    // Act
    await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
      getConnection(CMS_CONNECTION_NAME),
      getConnection(ASSESSMENTS_CONNECTION_NAME),
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
        contentId: lessonMaterial.contentId, // now it should be set as the cms content ID
      },
    })

    const dbAnswer = await getRepository(
      Answer,
      ASSESSMENTS_CONNECTION_NAME,
    ).findOneOrFail({
      where: {
        roomId: roomId,
        studentId: student.userId,
        contentId: lessonMaterial.contentId, // now it should be set as the cms content ID
      },
    })

    await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
      .createQueryBuilder()
      .where(`"userContentScoreContentId" = '${lessonMaterial.contentId}'`)
      .getOneOrFail()

    await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
      .createQueryBuilder()
      .where(`"userContentScoreContentId" = '${lessonMaterial.contentId}'`)
      .getOneOrFail()
  })
})

describe('migrateContentIdColumnsToUseContentIdInsteadOfH5pId', function () {
  after(async () => await dbDisconnect())

  it('full content id includes a subcontent id', async () => {
    // Arrange
    await dbConnect()
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
    const oldContentId = `${lessonMaterial.h5pId}|${lessonMaterial.subcontentId}`
    const userContentScore = await new UserContentScoreBuilder()
      .withroomId(roomId)
      .withStudentId(student.userId)
      .withContentId(oldContentId) // content ID is currently set as the h5p ID.
      .buildAndPersist()
    const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
    const teacherScore = await new TeacherScoreBuilder(
      userContentScore,
    ).buildAndPersist()

    expect(userContentScore.contentId).to.equal(oldContentId)
    expect(answer.contentId).to.equal(oldContentId)
    expect(teacherScore.contentId).to.equal(oldContentId)

    // Act
    await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
      getConnection(CMS_CONNECTION_NAME),
      getConnection(ASSESSMENTS_CONNECTION_NAME),
    )

    const newContentId = `${lessonMaterial.contentId}|${lessonMaterial.subcontentId}`

    // Assert
    const dbUserContentScore = await getRepository(
      UserContentScore,
      ASSESSMENTS_CONNECTION_NAME,
    ).findOneOrFail({
      where: {
        roomId: roomId,
        studentId: student.userId,
        contentId: newContentId, // now it should be set as the cms content ID
      },
    })

    const dbTeacherScore = await getRepository(
      TeacherScore,
      ASSESSMENTS_CONNECTION_NAME,
    ).findOneOrFail({
      where: {
        roomId: roomId,
        studentId: student.userId,
        contentId: newContentId, // now it should be set as the cms content ID
      },
    })

    const dbAnswer = await getRepository(
      Answer,
      ASSESSMENTS_CONNECTION_NAME,
    ).findOneOrFail({
      where: {
        roomId: roomId,
        studentId: student.userId,
        contentId: newContentId, // now it should be set as the cms content ID
      },
    })

    await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
      .createQueryBuilder()
      .where(`"userContentScoreContentId" = '${newContentId}'`)
      .getOneOrFail()

    await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
      .createQueryBuilder()
      .where(`"userContentScoreContentId" = '${newContentId}'`)
      .getOneOrFail()
  })
})

describe('migrateContentIdColumnsToUseContentIdInsteadOfH5pId', function () {
  after(async () => await dbDisconnect())

  it('full content id includes a subcontent id; does not include h5p id', async () => {
    // Arrange
    await dbConnect()
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
      .withContentId(fullContentId)
      .buildAndPersist()
    const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
    const teacherScore = await new TeacherScoreBuilder(
      userContentScore,
    ).buildAndPersist()

    expect(userContentScore.contentId).to.equal(fullContentId)
    expect(answer.contentId).to.equal(fullContentId)
    expect(teacherScore.contentId).to.equal(fullContentId)

    // Act
    await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
      getConnection(CMS_CONNECTION_NAME),
      getConnection(ASSESSMENTS_CONNECTION_NAME),
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
        contentId: fullContentId, // should not change
      },
    })

    const dbAnswer = await getRepository(
      Answer,
      ASSESSMENTS_CONNECTION_NAME,
    ).findOneOrFail({
      where: {
        roomId: roomId,
        studentId: student.userId,
        contentId: fullContentId, // should not change
      },
    })

    await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
      .createQueryBuilder()
      .where(`"userContentScoreContentId" = '${fullContentId}'`)
      .getOneOrFail()

    await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
      .createQueryBuilder()
      .where(`"userContentScoreContentId" = '${fullContentId}'`)
      .getOneOrFail()
  })
})
