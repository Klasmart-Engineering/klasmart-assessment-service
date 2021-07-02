import { expect } from 'chai'
import {
  AnswerBuilder,
  EndUserBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
  UserBuilder,
  UserContentScoreBuilder,
} from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { setTeacherScoreMutation } from '../queriesAndMutations/teacherScoreOps'
import { v4 } from 'uuid'
import {
  GqlContent,
  GqlTeacherScore,
  GqlUser,
} from '../queriesAndMutations/gqlInterfaces'
import { User } from '../../src/db/users/entities'
import { Content } from '../../src/db/cms/entities'
import EndUser from '../entities/endUser'
import { FindConditions, getRepository } from 'typeorm'
import { FileType } from '../../src/db/cms/enums'
import { TeacherScore } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import { TestTitle } from '../utils/testTitles'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import ContentKey from '../../src/helpers/contentKey'

/**
 * TODO:
 * - throws when wrong id
 * - scores exists (update)
 * - float
 */

describe('teacherScoreResolver.setScore', function () {
  const teacherScoreRepo = () =>
    getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)

  context(TestTitle.Authentication.context, () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      await dbConnect()
      const roomId = 'room1'
      const student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()

      const endUser = await new EndUserBuilder()
        .dontAuthenticate()
        .buildAndPersist()

      // Act
      const fn = () =>
        setTeacherScoreMutation(
          roomId,
          student.userId,
          lessonMaterial.contentId,
          1,
          endUser,
        )

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      await dbDisconnect()
    })
  })

  context(
    '[PRE CONTENT_ID MIGRATION] stored UserContentScore is using the h5pId',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let student: User
      let lessonMaterial: Content
      let gqlTeacherScore: GqlTeacherScore | undefined | null
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
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
          .withContentKey(lessonMaterial.h5pId!) // using h5pId instead of contentId
          .withContentType(xapiContentType)
          .withContentName(xapiContentName)
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
      })

      after(async () => await dbDisconnect())

      it('returns non-null/undefined TeacherScore', async () => {
        // Act
        gqlTeacherScore = await setTeacherScoreMutation(
          roomId,
          student.userId,
          lessonMaterial.contentId,
          1,
          endUser,
        )

        // Assert
        expect(gqlTeacherScore).to.not.be.null
        expect(gqlTeacherScore).to.not.be.undefined
      })

      it('returns expected teacherScore values', async () => {
        const expected: FindConditions<GqlTeacherScore> = {
          //date: ,
          //lastUpdated: ,
          score: 1,
        }
        expect(gqlTeacherScore).to.deep.include(expected)
      })

      it('returns expected teacherScore.student', async () => {
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(gqlTeacherScore?.student).to.deep.equal(expected)
      })

      it('returns expected teacherScore.teacher', async () => {
        const expected: FindConditions<GqlUser> = {
          user_id: endUser.userId,
          given_name: endUser.givenName,
          family_name: endUser.familyName,
        }
        expect(gqlTeacherScore?.teacher).to.deep.equal(expected)
      })

      it('returns expected teacherScore.content', async () => {
        const expectedContent: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: lessonMaterial.subcontentId ?? null,
          h5p_id: lessonMaterial.h5pId,
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlTeacherScore?.content).to.deep.equal(expectedContent)
      })

      it('DB: adds 1 TeacherScore entry', async () => {
        const dbTeacherScores = await teacherScoreRepo().find()
        expect(dbTeacherScores).to.have.lengthOf(1)
      })

      it('DB: TeacherScore has expected values', async () => {
        const dbTeacherScore = await teacherScoreRepo().findOneOrFail()

        const expected: FindConditions<TeacherScore> = {
          roomId: roomId,
          contentKey: lessonMaterial.h5pId, // make sure the teacherScore is stored using the h5pId just like the userContentScore.
          studentId: student.userId,
          teacherId: endUser.userId,
          //date
          //lastUpdated
          score: 1,
        }

        expect(dbTeacherScore).to.deep.include(expected)
      })
    },
  )

  context('1 UserContentScore, 1 Answer, 0 TeacherScores', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let student: User
    let lessonMaterial: Content
    let gqlTeacherScore: GqlTeacherScore | undefined | null
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()
      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
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
        .withContentKey(lessonMaterial.contentId)
        .withContentType(xapiContentType)
        .withContentName(xapiContentName)
        .buildAndPersist()
      const answer = await new AnswerBuilder(userContentScore).buildAndPersist()
    })

    after(async () => await dbDisconnect())

    it('returns non-null/undefined TeacherScore', async () => {
      // Act
      gqlTeacherScore = await setTeacherScoreMutation(
        roomId,
        student.userId,
        lessonMaterial.contentId,
        1,
        endUser,
      )

      // Assert
      expect(gqlTeacherScore).to.not.be.null
      expect(gqlTeacherScore).to.not.be.undefined
    })

    it('returns expected teacherScore values', async () => {
      const expected: FindConditions<GqlTeacherScore> = {
        //date: ,
        //lastUpdated: ,
        score: 1,
      }
      expect(gqlTeacherScore).to.deep.include(expected)
    })

    it('returns expected teacherScore.student', async () => {
      const expected: FindConditions<GqlUser> = {
        user_id: student.userId,
        given_name: student.givenName,
        family_name: student.familyName,
      }
      expect(gqlTeacherScore?.student).to.deep.equal(expected)
    })

    it('returns expected teacherScore.teacher', async () => {
      const expected: FindConditions<GqlUser> = {
        user_id: endUser.userId,
        given_name: endUser.givenName,
        family_name: endUser.familyName,
      }
      expect(gqlTeacherScore?.teacher).to.deep.equal(expected)
    })

    it('returns expected teacherScore.content', async () => {
      const expectedContent: FindConditions<GqlContent> = {
        content_id: lessonMaterial.contentId,
        subcontent_id: lessonMaterial.subcontentId ?? null,
        h5p_id: lessonMaterial.h5pId,
        name: xapiContentName,
        type: xapiContentType,
        fileType: FileType[FileType.H5P],
      }
      expect(gqlTeacherScore?.content).to.deep.equal(expectedContent)
    })

    it('DB: adds 1 TeacherScore entry', async () => {
      const dbTeacherScores = await teacherScoreRepo().find()
      expect(dbTeacherScores).to.have.lengthOf(1)
    })

    it('DB: TeacherScore has expected values', async () => {
      const dbTeacherScore = await teacherScoreRepo().findOneOrFail()

      const expected: FindConditions<TeacherScore> = {
        roomId: roomId,
        contentKey: lessonMaterial.contentId,
        studentId: student.userId,
        teacherId: endUser.userId,
        //date
        //lastUpdated
        score: 1,
      }

      expect(dbTeacherScore).to.deep.include(expected)
    })
  })

  context(
    '1 UserContentScore, 1 Answer, 0 TeacherScores, subcontent id',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let student: User
      let lessonMaterial: Content
      let gqlTeacherScore: GqlTeacherScore | undefined | null
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'
      let contentKey: string

      before(async () => {
        // Arrange
        await dbConnect()
        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        lessonMaterial = await new LessonMaterialBuilder()
          .withSubcontentId(v4())
          .buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        contentKey = ContentKey.construct(
          lessonMaterial.contentId,
          lessonMaterial.subcontentId,
        )
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(contentKey)
          .withContentType(xapiContentType)
          .withContentName(xapiContentName)
          .buildAndPersist()
        const answer = await new AnswerBuilder(
          userContentScore,
        ).buildAndPersist()
      })

      after(async () => await dbDisconnect())

      it('returns non-null/undefined TeacherScore', async () => {
        // Act
        gqlTeacherScore = await setTeacherScoreMutation(
          roomId,
          student.userId,
          contentKey,
          1,
          endUser,
        )

        // Assert
        expect(gqlTeacherScore).to.not.be.null
        expect(gqlTeacherScore).to.not.be.undefined
      })

      it('returns expected teacherScore values', async () => {
        const expected: FindConditions<GqlTeacherScore> = {
          //date: ,
          //lastUpdated: ,
          score: 1,
        }
        expect(gqlTeacherScore).to.deep.include(expected)
      })

      it('returns expected teacherScore.student', async () => {
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(gqlTeacherScore?.student).to.deep.equal(expected)
      })

      it('returns expected teacherScore.teacher', async () => {
        const expected: FindConditions<GqlUser> = {
          user_id: endUser.userId,
          given_name: endUser.givenName,
          family_name: endUser.familyName,
        }
        expect(gqlTeacherScore?.teacher).to.deep.equal(expected)
      })

      it('returns expected teacherScore.content', async () => {
        const expectedContent: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: lessonMaterial.subcontentId,
          h5p_id: lessonMaterial.h5pId,
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlTeacherScore?.content).to.deep.equal(expectedContent)
      })

      it('DB: adds 1 TeacherScore entry', async () => {
        const dbTeacherScores = await teacherScoreRepo().find()
        expect(dbTeacherScores).to.have.lengthOf(1)
      })

      it('DB: TeacherScore has expected values', async () => {
        const dbTeacherScore = await teacherScoreRepo().findOneOrFail()

        const expected: FindConditions<TeacherScore> = {
          roomId: roomId,
          contentKey: contentKey,
          studentId: student.userId,
          teacherId: endUser.userId,
          //date
          //lastUpdated
          score: 1,
        }

        expect(dbTeacherScore).to.deep.include(expected)
      })
    },
  )
})
