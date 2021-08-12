import { expect } from 'chai'
import {
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
 * - throws when not authenticated
 * - throws when
 * - add new score
 * - update existing score
 * TODO:
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
          false,
        )

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
    })

    after(async () => await dbDisconnect())
  })

  context(
    '1 UserContentScore matching provided student/content, but different room',
    () => {
      it('throws unknown UserContentScore error', async () => {
        // Arrange
        await dbConnect()
        const roomId = 'room1'
        const providedRoomId = 'room2'
        const student = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()

        const endUser = await new EndUserBuilder()
          .authenticate()
          .buildAndPersist()
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.contentId)
          .buildAndPersist()

        // Act
        const fn = () =>
          setTeacherScoreMutation(
            providedRoomId,
            student.userId,
            lessonMaterial.contentId,
            1,
            endUser,
            false,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unknownUserContentScore(
            providedRoomId,
            student.userId,
            lessonMaterial.contentId,
          ),
        )
      })

      after(async () => await dbDisconnect())
    },
  )

  context(
    '1 UserContentScore matching provided room/content, but different student',
    () => {
      it('throws unknown UserContentScore error', async () => {
        // Arrange
        await dbConnect()
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const someOtherStudent = await new UserBuilder().buildAndPersist()
        const providedStudentId = someOtherStudent.userId

        const endUser = await new EndUserBuilder()
          .authenticate()
          .buildAndPersist()
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.contentId)
          .buildAndPersist()

        // Act
        const fn = () =>
          setTeacherScoreMutation(
            roomId,
            providedStudentId,
            lessonMaterial.contentId,
            1,
            endUser,
            false,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unknownUserContentScore(
            roomId,
            providedStudentId,
            lessonMaterial.contentId,
          ),
        )
      })

      after(async () => await dbDisconnect())
    },
  )

  context(
    '1 UserContentScore matching provided room/student, but different content',
    () => {
      it('throws unknown UserContentScore error', async () => {
        // Arrange
        await dbConnect()
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const someOtherLessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const providedContentId = someOtherLessonMaterial.contentId

        const endUser = await new EndUserBuilder()
          .authenticate()
          .buildAndPersist()
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.contentId)
          .buildAndPersist()

        // Act
        const fn = () =>
          setTeacherScoreMutation(
            roomId,
            student.userId,
            providedContentId,
            1,
            endUser,
            false,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unknownUserContentScore(
            roomId,
            student.userId,
            providedContentId,
          ),
        )
      })

      after(async () => await dbDisconnect())
    },
  )

  context(
    '0 UserContentScores, 0 TeacherScores, provided contentId does not exist',
    () => {
      it('throws unknown UserContentScore error', async () => {
        // Arrange
        await dbConnect()
        const roomId = 'room1'
        const student = await new UserBuilder().buildAndPersist()
        const providedContentId = v4()

        const endUser = await new EndUserBuilder()
          .authenticate()
          .buildAndPersist()

        // Act
        const fn = () =>
          setTeacherScoreMutation(
            roomId,
            student.userId,
            providedContentId,
            1,
            endUser,
            false,
          )

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.unknownUserContentScore(
            roomId,
            student.userId,
            providedContentId,
          ),
        )
      })

      after(async () => await dbDisconnect())
    },
  )

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
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.h5pId!) // using h5pId instead of contentId
          .withContentType(xapiContentType)
          .withContentName(xapiContentName)
          .buildAndPersist()

        // Act
        gqlTeacherScore = await setTeacherScoreMutation(
          roomId,
          student.userId,
          lessonMaterial.contentId,
          1,
          endUser,
        )
      })

      after(async () => await dbDisconnect())

      it('returns non-null/undefined TeacherScore', async () => {
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
          parent_id: null,
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

  context('1 UserContentScore, 0 TeacherScores', () => {
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
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentKey(lessonMaterial.contentId)
        .withContentType(xapiContentType)
        .withContentName(xapiContentName)
        .buildAndPersist()

      // Act
      gqlTeacherScore = await setTeacherScoreMutation(
        roomId,
        student.userId,
        lessonMaterial.contentId,
        1,
        endUser,
      )
    })

    after(async () => await dbDisconnect())

    it('returns non-null/undefined TeacherScore', async () => {
      expect(gqlTeacherScore).to.not.be.null
      expect(gqlTeacherScore).to.not.be.undefined
    })

    it('returns expected teacherScore values', async () => {
      const expected: FindConditions<GqlTeacherScore> = {
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
        parent_id: null,
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

  context('1 UserContentScore, 0 TeacherScores, subcontent id', () => {
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
        .withContentParentId(lessonMaterial.h5pId)
        .buildAndPersist()

      // Act
      gqlTeacherScore = await setTeacherScoreMutation(
        roomId,
        student.userId,
        contentKey,
        1,
        endUser,
      )
    })

    after(async () => await dbDisconnect())

    it('returns non-null/undefined TeacherScore', async () => {
      expect(gqlTeacherScore).to.not.be.null
      expect(gqlTeacherScore).to.not.be.undefined
    })

    it('returns expected teacherScore values', async () => {
      const expected: FindConditions<GqlTeacherScore> = {
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
        parent_id: lessonMaterial.h5pId,
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
  })
})
