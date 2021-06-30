import { expect } from 'chai'
import {
  AnswerBuilder,
  EndUserBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
  TeacherScoreBuilder,
  UserBuilder,
  UserContentScoreBuilder,
} from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { createH5pIdToCmsContentIdCache } from '../../src/helpers/getContent'
import { setTeacherScoreMutation } from '../queriesAndMutations/teacherScoreOps'
import { v4 } from 'uuid'

describe('tests.setScore', function () {
  it('score is set to 1', async () => {
    // Arrange
    await dbConnect()
    const roomId = 'room1'
    const endUser = await new EndUserBuilder().authenticate().buildAndPersist()
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
      .withContentId(lessonMaterial.contentId)
      .buildAndPersist()
    const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
    const teacherScore = await new TeacherScoreBuilder(
      userContentScore,
    ).buildAndPersist()

    // Act
    const gqlTeacherScore = await setTeacherScoreMutation(
      roomId,
      student.userId,
      lessonMaterial.contentId,
      1,
      endUser,
    )

    // Assert
    expect(gqlTeacherScore?.score).is.equal(1)
    await dbDisconnect()
  })

  context('full content id includes subcontent id', function () {
    it('score is set to 1', async () => {
      // Arrange
      await dbConnect()
      const roomId = 'room1'
      const endUser = await new EndUserBuilder()
        .authenticate()
        .buildAndPersist()
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder()
        .withSubcontentId(v4())
        .buildAndPersist()
      const fullContentId = `${lessonMaterial.contentId}|${lessonMaterial.subcontentId}`
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(fullContentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentId(lessonMaterial.contentId)
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
      const teacherScore = await new TeacherScoreBuilder(
        userContentScore,
      ).buildAndPersist()

      // Act
      const gqlTeacherScore = await setTeacherScoreMutation(
        roomId,
        student.userId,
        lessonMaterial.contentId,
        1,
        endUser,
      )

      // Assert
      expect(gqlTeacherScore?.score).is.equal(1)
      await dbDisconnect()
    })
  })

  context(
    'h5p id is provided instead of a content id; entry exists in h5pIdToCmsContentIdCache',
    () => {
      after(async () => await dbDisconnect())

      it('score is set to 1', async () => {
        // Arrange
        await dbConnect()
        const roomId = 'room1'
        const endUser = await new EndUserBuilder()
          .authenticate()
          .buildAndPersist()
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
          .withContentId(lessonMaterial.contentId)
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
        const teacherScore = await new TeacherScoreBuilder(
          userContentScore,
        ).buildAndPersist()

        // Act
        await createH5pIdToCmsContentIdCache()
        const gqlTeacherScore = await setTeacherScoreMutation(
          roomId,
          student.userId,
          lessonMaterial.h5pId!,
          1,
          endUser,
        )

        // Assert
        expect(gqlTeacherScore?.score).is.equal(1)
      })
    },
  )

  context(
    'h5p id is provided instead of a content id; entry does not exist in h5pIdToCmsContentIdCache',
    () => {
      after(async () => await dbDisconnect())

      it('score is set to 1', async () => {
        // Arrange
        await dbConnect()
        const roomId = 'room1'
        const endUser = await new EndUserBuilder()
          .authenticate()
          .buildAndPersist()
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
          .withContentId(lessonMaterial.contentId)
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
        const teacherScore = await new TeacherScoreBuilder(
          userContentScore,
        ).buildAndPersist()

        // Act
        const gqlTeacherScore = await setTeacherScoreMutation(
          roomId,
          student.userId,
          lessonMaterial.h5pId!,
          1,
          endUser,
        )

        // Assert
        expect(gqlTeacherScore?.score).is.equal(1)
      })
    },
  )
})
