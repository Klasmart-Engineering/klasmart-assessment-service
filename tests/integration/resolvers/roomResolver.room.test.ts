import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { FindConditions, getRepository } from 'typeorm'
import { Container as MutableContainer } from 'typedi'

import expect from '../../utils/chaiAsPromisedSetup'
import { ErrorMessage } from '../../../src/helpers/errorMessages'
import { TestTitle } from '../../utils/testTitles'
import { XApiRecord } from '../../../src/db/xapi'
import '../../utils/globalIntegrationTestHooks'
import EndUser from '../../entities/endUser'

import {
  dbConnect,
  dbDisconnect,
  createSubstitutesToExpectedInjectableServices,
} from '../../utils/globalIntegrationTestHooks'
import { Content } from '../../../src/db/cms/entities/content'
import { FileType } from '../../../src/db/cms/enums/fileType'
import {
  GqlUser,
  GqlContent,
  GqlScoreSummary,
  GqlAnswer,
  GqlTeacherScore,
  GqlTeacherComment,
  GqlTeacherCommentsByStudent,
} from '../../queriesAndMutations/gqlInterfaces'
import {
  GqlRoom,
  roomQuery,
  roomQueryWithCookie,
} from '../../queriesAndMutations/roomOps'
import {
  AnswerBuilder,
  EndUserBuilder,
  LessonMaterialBuilder,
  RawAnswerBuilder,
  RoomBuilder,
  ScheduleBuilder,
  TeacherScoreBuilder,
  UserBuilder,
  UserContentScoreBuilder,
  XApiRecordBuilder,
} from '../../builders'
import {
  Answer,
  RawAnswer,
  Room,
  TeacherComment,
  TeacherScore,
  UserContentScore,
} from '../../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../../src/db/assessments/connectToAssessmentDatabase'
import TeacherCommentBuilder from '../../builders/teacherCommentBuilder'
import ContentKey from '../../../src/helpers/contentKey'
import { CmsScheduleProvider } from '../../../src/providers/cmsScheduleProvider'
import { CmsContentProvider } from '../../../src/providers/cmsContentProvider'
import { User } from '../../../src/web/user'
import DiKeys from '../../../src/initialization/diKeys'
import { H5pContentProvider } from '../../../src/providers/h5pContentProvider'

/**
 * - scores 0 the first time
 * - room/ucs/answer exist (update), make sure teacher scores and comments don't get wiped out
 * - non-h5p materials
 * - user content score ordering
 * - include user content scores for students with no events
 * - multiple students
 * - multiple contents
 * - xapi event not part of lesson plan
 * - score and response are null
 * - response is included but score is not
 * - subcontentId
 */

describe('roomResolver.Room', () => {
  const roomRepo = () => getRepository(Room, ASSESSMENTS_CONNECTION_NAME)
  const userContentScoreRepo = () =>
    getRepository(UserContentScore, ASSESSMENTS_CONNECTION_NAME)
  const answerRepo = () => getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)
  const teacherScoreRepo = () =>
    getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME)
  const teacherCommentRepo = () =>
    getRepository(TeacherComment, ASSESSMENTS_CONNECTION_NAME)

  context(TestTitle.Authentication.context, () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      await dbConnect()
      createSubstitutesToExpectedInjectableServices()
      MutableContainer.set(DiKeys.CmsApiUrl, 'https://cms.dummyurl.net')
      MutableContainer.set(DiKeys.H5pUrl, 'https://h5p.dummyurl.net')

      const roomId = 'room1'
      const endUser = new EndUserBuilder().dontAuthenticate().build()

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
    })

    after(async () => await dbDisconnect())
  })

  context('auth token expired', () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      await dbConnect()
      createSubstitutesToExpectedInjectableServices()

      const roomId = 'room1'
      const endUser = new EndUserBuilder().expiredToken().build()

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejected
    })

    after(async () => await dbDisconnect())
  })

  context(
    'authorization cookies are defined, ' + TestTitle.ScheduleNotFound.context,
    () => {
      it(TestTitle.ScheduleNotFound.throwsError, async () => {
        // Arrange
        await dbConnect()
        MutableContainer.set(DiKeys.CmsApiUrl, 'https://cms.dummyurl.net')
        MutableContainer.set(DiKeys.H5pUrl, 'https://h5p.dummyurl.net')

        const roomId = 'room1'
        const endUser = new EndUserBuilder().authenticate().build()

        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .rejects(ErrorMessage.scheduleNotFound(roomId))
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, endUser.token)
          .rejects(ErrorMessage.scheduleNotFound(roomId))
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        // Act
        const fn = () =>
          roomQueryWithCookie(roomId, { access: endUser.token }, false)

        // Assert
        await expect(fn()).to.be.rejectedWith(
          ErrorMessage.scheduleNotFound(roomId),
        )
      })

      after(async () => await dbDisconnect())
    },
  )

  context(TestTitle.ScheduleNotFound.context, () => {
    it(TestTitle.ScheduleNotFound.throwsError, async () => {
      // Arrange
      await dbConnect()
      MutableContainer.set(DiKeys.CmsApiUrl, 'https://cms.dummyurl.net')
      MutableContainer.set(DiKeys.H5pUrl, 'https://h5p.dummyurl.net')

      const roomId = 'room1'
      const endUser = new EndUserBuilder().authenticate().build()

      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider
        .getSchedule(roomId, endUser.token)
        .rejects(ErrorMessage.scheduleNotFound(roomId))
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, endUser.token)
        .rejects(ErrorMessage.scheduleNotFound(roomId))
      MutableContainer.set(CmsContentProvider, cmsContentProvider)

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.scheduleNotFound(roomId),
      )
    })

    after(async () => await dbDisconnect())
  })

  context(
    '1 student, 1 xapi "score" event, no existing UserContentScores, no existing answers',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let rawAnswer: RawAnswer
      const h5pId = 'h5p1'
      const contentName = 'My H5P Name'
      const contentType = 'Flashcards'
      const score = { min: 0, max: 3, raw: 2 }

      before(async () => {
        // Arrange
        await dbConnect()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()

        lessonMaterial = new LessonMaterialBuilder()
          .withSource(FileType.H5P, h5pId)
          .withName(contentName)
          .build()

        rawAnswer = await new RawAnswerBuilder()
          .withRoomId(roomId)
          .withStudentId(student.userId)
          .withH5pId(h5pId)
          .withScore(score.raw)
          .withResponse(undefined)
          .withMinimumPossibleScore(score.min)
          .withMaximumPossibleScore(score.max)
          .buildAndPersist()

        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(Arg.all())
          .rejects('This should not have been called.')
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const h5pContentProvider = Substitute.for<H5pContentProvider>()
        h5pContentProvider
          .getH5pContents(Arg.any(), endUser.token)
          .resolves(
            new Map([
              [h5pId, { id: h5pId, type: contentType, subContents: [] }],
            ]),
          )
        MutableContainer.set(H5pContentProvider, h5pContentProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterials(roomId, endUser.token).resolves({
          contents: new Map([
            [
              lessonMaterial.contentId,
              { content: lessonMaterial, subContents: [] },
            ],
          ]),
          studentContentMap: [
            {
              studentId: student.userId,
              contentIds: [lessonMaterial.contentId],
            },
          ],
        })
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        gqlRoom = await roomQuery(roomId, endUser)
      })

      after(async () => await dbDisconnect())

      it('returns room with expected id', async () => {
        expect(gqlRoom).to.not.be.null
        expect(gqlRoom).to.not.be.undefined
        expect(gqlRoom?.room_id).to.equal(roomId)
      })

      it('returns room.scores with length of 1', async () => {
        const gqlScores = gqlRoom?.scores
        expect(gqlScores).to.have.lengthOf(1)
      })

      it('returns room.scores[0].teacherScores with length of 0', async () => {
        const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
        expect(gqlTeacherScores).to.have.lengthOf(0)
      })

      it('returns expected room.scores[0].user', async () => {
        const actual = gqlRoom?.scores?.[0]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: null,
          family_name: null,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].content', async () => {
        const actual = gqlRoom?.scores?.[0]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: lessonMaterial.subcontentId ?? null,
          h5p_id: lessonMaterial.h5pId,
          parent_id: null,
          name: contentName,
          type: contentType,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].score', async () => {
        const actual = gqlRoom?.scores?.[0]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: 2,
          min: 2,
          mean: 2,
          median: 2,
          medians: [2],
          scoreFrequency: 1,
          scores: [2],
          sum: 2,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.scores[0].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const actual = gqlRoom?.scores?.[0]?.score?.answers
        const expected: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: rawAnswer.timestamp,
            maximumPossibleScore: 3,
            minimumPossibleScore: 0,
            score: 2,
          },
        ]
        expect(actual).to.deep.equal(expected)
      })

      it('returns room.teacherComments with length of 0', async () => {
        const gqlComments = gqlRoom?.teacherComments
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('returns room.teacherCommentsByStudent with length of 0', async () => {
        const gqlComments = gqlRoom?.teacherCommentsByStudent
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('DB: adds 1 Room entry', async () => {
        const dbRooms = await roomRepo().count()
        expect(dbRooms).to.equal(1)
      })

      it('DB: Room has expected values', async () => {
        const actual = await roomRepo().findOneOrFail()
        const expected: FindConditions<Room> = {
          roomId: roomId,
          startTime: null,
          endTime: null,
          attendanceCount: null,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 1 UserContentScore entry', async () => {
        const dbUserContentScores = await userContentScoreRepo().count()
        expect(dbUserContentScores).to.equal(1)
      })

      it('DB: UserContentScore has expected values', async () => {
        const actual = await userContentScoreRepo().findOneOrFail()
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          contentName: contentName,
          contentType: contentType,
          seen: true,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 1 Answer entry', async () => {
        const dbAnswers = await answerRepo().count()
        expect(dbAnswers).to.equal(1)
      })

      it('DB: Answer has expected values', async () => {
        const dbAnswer = await answerRepo().findOneOrFail()

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          answer: null,
          date: new Date(rawAnswer.timestamp),
          maximumPossibleScore: score.max,
          minimumPossibleScore: score.min,
          score: score.raw,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  context(
    '1 student, 1 xapi "answer" event, 1 existing UserContentScore, no existing answers',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let existingUcs: UserContentScore
      let rawAnswer: RawAnswer
      const h5pId = 'h5p1'
      const contentName = 'My H5P Name'
      const contentType = 'Flashcards'
      const response = 'Badanamu'

      before(async () => {
        // Arrange
        await dbConnect()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()

        lessonMaterial = new LessonMaterialBuilder()
          .withSource(FileType.H5P, h5pId)
          .withName(contentName)
          .build()

        const ucsBuilder = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.contentId)
          .withH5pId(h5pId)
          .withContentName(contentName)
          .withContentType(contentType)
        existingUcs = ucsBuilder.withSeen(false).build()

        existingUcs.answers = Promise.resolve([])
        const room = await new RoomBuilder()
          .withRoomId(roomId)
          .withUcs([existingUcs])
          .buildAndPersist()

        rawAnswer = await new RawAnswerBuilder()
          .withRoomId(roomId)
          .withStudentId(student.userId)
          .withH5pId(h5pId)
          .withScore(undefined)
          .withResponse(response)
          .withMinimumPossibleScore(undefined)
          .withMaximumPossibleScore(undefined)
          .buildAndPersist()

        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(Arg.all())
          .rejects('This should not have been called.')
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const h5pContentProvider = Substitute.for<H5pContentProvider>()
        h5pContentProvider
          .getH5pContents(Arg.any(), endUser.token)
          .resolves(
            new Map([
              [h5pId, { id: h5pId, type: contentType, subContents: [] }],
            ]),
          )
        MutableContainer.set(H5pContentProvider, h5pContentProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterials(roomId, endUser.token).resolves({
          contents: new Map([
            [
              lessonMaterial.contentId,
              { content: lessonMaterial, subContents: [] },
            ],
          ]),
          studentContentMap: [
            {
              studentId: student.userId,
              contentIds: [lessonMaterial.contentId],
            },
          ],
        })
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        gqlRoom = await roomQuery(roomId, endUser)
      })

      after(async () => await dbDisconnect())

      it('returns room with expected id', async () => {
        expect(gqlRoom).to.not.be.null
        expect(gqlRoom).to.not.be.undefined
        expect(gqlRoom?.room_id).to.equal(roomId)
      })

      it('returns room.scores with length of 1', async () => {
        const gqlScores = gqlRoom?.scores
        expect(gqlScores).to.have.lengthOf(1)
      })

      it('returns room.scores[0].teacherScores with length of 0', async () => {
        const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
        expect(gqlTeacherScores).to.have.lengthOf(0)
      })

      it('returns expected room.scores[0].user', async () => {
        const actual = gqlRoom?.scores?.[0]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: null,
          family_name: null,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].content', async () => {
        const actual = gqlRoom?.scores?.[0]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: lessonMaterial.subcontentId ?? null,
          h5p_id: lessonMaterial.h5pId,
          parent_id: null,
          name: contentName,
          type: contentType,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].score', async () => {
        const actual = gqlRoom?.scores?.[0]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: null,
          min: null,
          mean: null,
          median: null,
          medians: [],
          scoreFrequency: 0,
          scores: [],
          sum: 0,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.scores[0].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const actual = gqlRoom?.scores?.[0]?.score?.answers
        const expected: FindConditions<GqlAnswer>[] = [
          {
            answer: response,
            date: rawAnswer.timestamp,
            maximumPossibleScore: null,
            minimumPossibleScore: null,
            score: null,
          },
        ]
        expect(actual).to.deep.equal(expected)
      })

      it('returns room.teacherComments with length of 0', async () => {
        const gqlComments = gqlRoom?.teacherComments
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('returns room.teacherCommentsByStudent with length of 0', async () => {
        const gqlComments = gqlRoom?.teacherCommentsByStudent
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('DB: adds 1 Room entry', async () => {
        const dbRooms = await roomRepo().count()
        expect(dbRooms).to.equal(1)
      })

      it('DB: Room has expected values', async () => {
        const actual = await roomRepo().findOneOrFail()
        const expected: FindConditions<Room> = {
          roomId: roomId,
          startTime: null,
          endTime: null,
          attendanceCount: null,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 1 UserContentScore entry', async () => {
        const dbUserContentScores = await userContentScoreRepo().count()
        expect(dbUserContentScores).to.equal(1)
      })

      it('DB: UserContentScore has expected values', async () => {
        const actual = await userContentScoreRepo().findOneOrFail()
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          contentName: contentName,
          contentType: contentType,
          seen: true,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 1 Answer entry', async () => {
        const dbAnswers = await answerRepo().count()
        expect(dbAnswers).to.equal(1)
      })

      it('DB: Answer has expected values', async () => {
        const dbAnswer = await answerRepo().findOneOrFail()

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          answer: response,
          date: new Date(rawAnswer.timestamp),
          maximumPossibleScore: null,
          minimumPossibleScore: null,
          score: null,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  context(
    '1 student, 1 xapi "score" event for subcontent1, 1 xapi "score" event for subcontent2',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let sub1Answer: RawAnswer
      let sub2Answer: RawAnswer
      const h5pId = 'h5p1'
      const contentName = 'My H5P Name'
      const contentType = 'Flashcards'
      const subType1 = 'subType1'
      const subType2 = 'subType2'
      const subName1 = 'subName1'
      const subName2 = 'subName2'
      const subcontent1Id = 'sub1'
      const subcontent2Id = 'sub2'

      before(async () => {
        // Arrange
        await dbConnect()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()

        const materialBuilder = new LessonMaterialBuilder()
          .withSource(FileType.H5P, h5pId)
          .withName(contentName)
        lessonMaterial = materialBuilder.build()

        sub1Answer = await new RawAnswerBuilder()
          .withRoomId(roomId)
          .withStudentId(student.userId)
          .withH5pId(h5pId)
          .withH5pSubId(subcontent1Id)
          .withScore(2)
          .withResponse(undefined)
          .withMinimumPossibleScore(0)
          .withMaximumPossibleScore(3)
          .buildAndPersist()
        sub2Answer = await new RawAnswerBuilder()
          .withRoomId(roomId)
          .withStudentId(student.userId)
          .withH5pId(h5pId)
          .withH5pSubId(subcontent2Id)
          .withScore(1)
          .withResponse(undefined)
          .withMinimumPossibleScore(0)
          .withMaximumPossibleScore(2)
          .buildAndPersist()

        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(Arg.all())
          .rejects('This should not have been called.')
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const h5pContentProvider = Substitute.for<H5pContentProvider>()
        h5pContentProvider.getH5pContents(Arg.any(), endUser.token).resolves(
          new Map([
            [
              h5pId,
              {
                id: h5pId,
                type: contentType,
                subContents: [
                  {
                    id: subcontent1Id,
                    parentId: h5pId,
                    type: subType1,
                    name: subName1,
                  },
                  {
                    id: subcontent2Id,
                    parentId: h5pId,
                    type: subType2,
                    name: subName2,
                  },
                ],
              },
            ],
          ]),
        )
        MutableContainer.set(H5pContentProvider, h5pContentProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterials(roomId, endUser.token).resolves({
          contents: new Map([
            [
              lessonMaterial.contentId,
              {
                content: lessonMaterial,
                subContents: [],
              },
            ],
          ]),
          studentContentMap: [
            {
              studentId: student.userId,
              contentIds: [lessonMaterial.contentId],
            },
          ],
        })
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        gqlRoom = await roomQuery(roomId, endUser)
      })

      after(async () => await dbDisconnect())

      it('returns room with expected id', async () => {
        expect(gqlRoom).to.not.be.null
        expect(gqlRoom).to.not.be.undefined
        expect(gqlRoom?.room_id).to.equal(roomId)
      })

      it('returns room.scores with length of 3', async () => {
        const gqlScores = gqlRoom?.scores
        expect(gqlScores).to.have.lengthOf(3)
      })

      it('returns room.scores[0].teacherScores with length of 0', async () => {
        const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
        expect(gqlTeacherScores).to.have.lengthOf(0)
      })

      it('returns expected room.scores[0].user', async () => {
        const actual = gqlRoom?.scores?.[0]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: null,
          family_name: null,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].user', async () => {
        const actual = gqlRoom?.scores?.[1]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: null,
          family_name: null,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].user', async () => {
        const actual = gqlRoom?.scores?.[2]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: null,
          family_name: null,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].content', async () => {
        const actual = gqlRoom?.scores?.[0]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: null,
          h5p_id: lessonMaterial.h5pId,
          parent_id: null,
          name: lessonMaterial.name,
          type: contentType,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].content', async () => {
        const actual = gqlRoom?.scores?.[1]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: subcontent1Id,
          h5p_id: lessonMaterial.h5pId,
          parent_id: lessonMaterial.h5pId,
          name: subName1,
          type: subType1,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].content', async () => {
        const actual = gqlRoom?.scores?.[2]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: subcontent2Id,
          h5p_id: lessonMaterial.h5pId,
          parent_id: lessonMaterial.h5pId,
          name: subName2,
          type: subType2,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].score', async () => {
        const actual = gqlRoom?.scores?.[0]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: null,
          min: null,
          mean: null,
          median: null,
          medians: [],
          scoreFrequency: 0,
          scores: [],
          sum: 0,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns expected room.scores[1].score', async () => {
        const actual = gqlRoom?.scores?.[1]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: 2,
          min: 2,
          mean: 2,
          median: 2,
          medians: [2],
          scoreFrequency: 1,
          scores: [2],
          sum: 2,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns expected room.scores[2].score', async () => {
        const actual = gqlRoom?.scores?.[2]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: 1,
          min: 1,
          mean: 1,
          median: 1,
          medians: [1],
          scoreFrequency: 1,
          scores: [1],
          sum: 1,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.scores[0].score.answers with length of 0', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(0)
      })

      it('returns room.scores[1].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[1]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns room.scores[2].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[2]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[1].score.answers', async () => {
        const actual = gqlRoom?.scores?.[1]?.score?.answers
        const expected: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: sub1Answer.timestamp,
            maximumPossibleScore: 3,
            minimumPossibleScore: 0,
            score: 2,
          },
        ]
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].score.answers', async () => {
        const actual = gqlRoom?.scores?.[2]?.score?.answers
        const expected: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: sub2Answer.timestamp,
            maximumPossibleScore: 2,
            minimumPossibleScore: 0,
            score: 1,
          },
        ]
        expect(actual).to.deep.equal(expected)
      })

      it('returns room.teacherComments with length of 0', async () => {
        const gqlComments = gqlRoom?.teacherComments
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('returns room.teacherCommentsByStudent with length of 0', async () => {
        const gqlComments = gqlRoom?.teacherCommentsByStudent
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('DB: adds 1 Room entry', async () => {
        const dbRooms = await roomRepo().find()
        expect(dbRooms).to.have.lengthOf(1)
      })

      it('DB: Room has expected values', async () => {
        const actual = await roomRepo().findOneOrFail()
        const expected: FindConditions<Room> = {
          roomId: roomId,
          startTime: null,
          endTime: null,
          attendanceCount: null,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 3 UserContentScore entries', async () => {
        const count = await userContentScoreRepo().count()
        expect(count).to.equal(3)
      })

      it('DB: UserContentScore (root content) has expected values', async () => {
        const actual = await userContentScoreRepo().findOne({
          where: {
            contentKey: lessonMaterial.contentId,
          },
        })
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          contentName: contentName,
          contentType: contentType,
          seen: false,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: UserContentScore (subcontent1) has expected values', async () => {
        const actual = await userContentScoreRepo().findOne({
          where: {
            contentKey: ContentKey.construct(
              lessonMaterial.contentId,
              subcontent1Id,
            ),
          },
        })
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: ContentKey.construct(
            lessonMaterial.contentId,
            subcontent1Id,
          ),
          contentName: subName1,
          contentType: subType1,
          seen: true,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: UserContentScore (subcontent2) has expected values', async () => {
        const actual = await userContentScoreRepo().findOne({
          where: {
            contentKey: ContentKey.construct(
              lessonMaterial.contentId,
              subcontent2Id,
            ),
          },
        })
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: ContentKey.construct(
            lessonMaterial.contentId,
            subcontent2Id,
          ),
          contentName: subName2,
          contentType: subType2,
          seen: true,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 2 Answer entries', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(2)
      })

      it('DB: Answer 1 has expected values', async () => {
        const contentKey = ContentKey.construct(
          lessonMaterial.contentId,
          subcontent1Id,
        )
        const dbAnswer = await answerRepo().findOneOrFail({
          where: { contentKey },
        })

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          answer: null,
          timestamp: sub1Answer.timestamp,
          maximumPossibleScore: 3,
          minimumPossibleScore: 0,
          score: 2,
        }

        expect(dbAnswer).to.deep.include(expected)
      })

      it('DB: Answer 2 has expected values', async () => {
        const contentKey = ContentKey.construct(
          lessonMaterial.contentId,
          subcontent2Id,
        )
        const dbAnswer = await answerRepo().findOneOrFail({
          where: { contentKey },
        })

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          answer: null,
          timestamp: sub2Answer.timestamp,
          maximumPossibleScore: 2,
          minimumPossibleScore: 0,
          score: 1,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  // TODO
  context.skip('student1 0 xapi events; student2 1 xapi "score" event', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student1: User
    let student2: User
    let lessonMaterial: Content
    let xapiRecord: XApiRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()

      endUser = new EndUserBuilder().authenticate().build()
      student1 = new UserBuilder().build()
      student2 = new UserBuilder().build()

      lessonMaterial = new LessonMaterialBuilder().build()
      const schedule = new ScheduleBuilder().withRoomId(roomId).build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student2.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore({ min: 0, max: 2, raw: 1 })
        .build()
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider.getLessonMaterials(roomId, endUser.token).resolves({
        contents: new Map([
          [
            lessonMaterial.contentId,
            { content: lessonMaterial, subContents: [] },
          ],
        ]),
        studentContentMap: [
          {
            studentId: student1.userId,
            contentIds: [lessonMaterial.contentId],
          },
          {
            studentId: student2.userId,
            contentIds: [lessonMaterial.contentId],
          },
        ],
      })
      cmsContentProvider
        .getLessonMaterial(lessonMaterial.contentId, endUser.token)
        .resolves(lessonMaterial)
      MutableContainer.set(CmsContentProvider, cmsContentProvider)

      gqlRoom = await roomQuery(roomId, endUser)
    })

    after(async () => await dbDisconnect())

    it('returns room with expected id', async () => {
      expect(gqlRoom).to.not.be.null
      expect(gqlRoom).to.not.be.undefined
      expect(gqlRoom?.room_id).to.equal(roomId)
    })

    it('returns room.scores with length of 2', async () => {
      const gqlScores = gqlRoom?.scores
      expect(gqlScores).to.have.lengthOf(2)
    })

    it('returns room.scores[0].teacherScores with length of 0', async () => {
      const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
      expect(gqlTeacherScores).to.have.lengthOf(0)
    })

    it('returns expected room.scores[0].user', async () => {
      const actual = gqlRoom?.scores?.[0]?.user
      const expected: FindConditions<GqlUser> = {
        user_id: student1.userId,
        given_name: null,
        family_name: null,
      }
      expect(actual).to.deep.equal(expected)
    })

    it('returns expected room.scores[1].user', async () => {
      const actual = gqlRoom?.scores?.[1]?.user
      const expected: FindConditions<GqlUser> = {
        user_id: student2.userId,
        given_name: null,
        family_name: null,
      }
      expect(actual).to.deep.equal(expected)
    })

    it('returns expected room.scores[0].content', async () => {
      const actual = gqlRoom?.scores?.[0]?.content
      const expected: FindConditions<GqlContent> = {
        content_id: lessonMaterial.contentId,
        subcontent_id: lessonMaterial.subcontentId ?? null,
        h5p_id: lessonMaterial.h5pId,
        parent_id: null,
        name: xapiContentName,
        type: xapiContentType,
        fileType: FileType[FileType.H5P],
      }
      expect(actual).to.deep.equal(expected)
    })

    it('returns expected room.scores[1].content', async () => {
      const actual = gqlRoom?.scores?.[1]?.content
      const expected: FindConditions<GqlContent> = {
        content_id: lessonMaterial.contentId,
        subcontent_id: lessonMaterial.subcontentId ?? null,
        h5p_id: lessonMaterial.h5pId,
        parent_id: null,
        name: xapiContentName,
        type: xapiContentType,
        fileType: FileType[FileType.H5P],
      }
      expect(actual).to.deep.equal(expected)
    })

    it('returns expected room.scores[0].score', async () => {
      const gqlScore = gqlRoom?.scores?.[0]?.score
      const expectedScore: FindConditions<GqlScoreSummary> = {
        max: null,
        min: null,
        mean: null,
        median: null,
        medians: [],
        scoreFrequency: 0,
        scores: [],
        sum: 0,
      }
      expect(gqlScore).to.deep.include(expectedScore)
    })

    it('returns expected room.scores[1].score', async () => {
      const gqlScore = gqlRoom?.scores?.[1]?.score
      const expectedScore: FindConditions<GqlScoreSummary> = {
        max: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        min: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        mean: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        median: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        medians: [xapiRecord.xapi?.data?.statement?.result?.score?.raw],
        scoreFrequency: 1,
        scores: [xapiRecord.xapi?.data?.statement?.result?.score?.raw],
        sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
      }
      expect(gqlScore).to.deep.include(expectedScore)
    })

    it('returns room.scores[0].score.answers with length of 0', async () => {
      const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
      expect(gqlAnswers).to.have.lengthOf(0)
    })

    it('returns room.scores[1].score.answers with length of 1', async () => {
      const gqlAnswers = gqlRoom?.scores?.[1]?.score?.answers
      expect(gqlAnswers).to.have.lengthOf(1)
    })

    it('returns expected room.scores[1].score.answers', async () => {
      const actual = gqlRoom?.scores?.[1]?.score?.answers
      const expected: FindConditions<GqlAnswer>[] = [
        {
          answer: null,
          date: xapiRecord.xapi?.clientTimestamp,
          maximumPossibleScore:
            xapiRecord.xapi?.data?.statement?.result?.score?.max,
          minimumPossibleScore:
            xapiRecord.xapi?.data?.statement?.result?.score?.min,
          score: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        },
      ]
      expect(actual).to.deep.equal(expected)
    })

    it('returns room.teacherComments with length of 0', async () => {
      const gqlComments = gqlRoom?.teacherComments
      expect(gqlComments).to.have.lengthOf(0)
    })

    it('returns room.teacherCommentsByStudent with length of 0', async () => {
      const gqlComments = gqlRoom?.teacherCommentsByStudent
      expect(gqlComments).to.have.lengthOf(0)
    })

    it('DB: adds 1 Room entry', async () => {
      const dbRooms = await roomRepo().find()
      expect(dbRooms).to.have.lengthOf(1)
    })

    it('DB: Room has expected values', async () => {
      const dbRoom = await roomRepo().findOneOrFail()

      const expected: FindConditions<Room> = {
        roomId: roomId,
        startTime: null,
        endTime: null,
        attendanceCount: 3,
      }

      expect(dbRoom).to.deep.include(expected)
    })

    it('DB: adds 2 UserContentScore entries', async () => {
      const count = await userContentScoreRepo().count()
      expect(count).to.equal(2)
    })

    it('DB: student1 UserContentScore has expected values', async () => {
      const actual = await userContentScoreRepo().findOneOrFail({
        where: { studentId: student1.userId },
      })

      const expected: FindConditions<UserContentScore> = {
        roomId: roomId,
        studentId: student1.userId,
        contentKey: lessonMaterial.contentId,
        contentName: xapiContentName,
        contentType: xapiContentType,
        seen: false,
      }

      expect(actual).to.deep.include(expected)
    })

    it('DB: student2 UserContentScore has expected values', async () => {
      const actual = await userContentScoreRepo().findOneOrFail({
        where: { studentId: student2.userId },
      })

      const expected: FindConditions<UserContentScore> = {
        roomId: roomId,
        studentId: student2.userId,
        contentKey: lessonMaterial.contentId,
        contentName: xapiContentName,
        contentType: xapiContentType,
        seen: true,
      }

      expect(actual).to.deep.include(expected)
    })

    it('DB: adds 1 Answer entry', async () => {
      const dbAnswers = await answerRepo().find()
      expect(dbAnswers).to.have.lengthOf(1)
    })

    it('DB: Answer has expected values', async () => {
      const dbAnswer = await answerRepo().findOneOrFail()

      const expected: FindConditions<Answer> = {
        roomId: roomId,
        studentId: student2.userId,
        answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
        date: new Date(xapiRecord.xapi?.clientTimestamp ?? 0),
        maximumPossibleScore: 2,
        minimumPossibleScore: 0,
        score: 1,
      }

      expect(dbAnswer).to.deep.include(expected)
    })
  })

  // TODO
  context.skip('1 student, 1 non-h5p material', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content

    before(async () => {
      // Arrange
      await dbConnect()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()

      lessonMaterial = new LessonMaterialBuilder()
        .withSource(FileType.Audio)
        .build()
      const schedule = new ScheduleBuilder().withRoomId(roomId).build()
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider.getLessonMaterials(roomId, endUser.token).resolves({
        contents: new Map([
          [
            lessonMaterial.contentId,
            { content: lessonMaterial, subContents: [] },
          ],
        ]),
        studentContentMap: [
          { studentId: student.userId, contentIds: [lessonMaterial.contentId] },
        ],
      })
      cmsContentProvider
        .getLessonMaterial(lessonMaterial.contentId, endUser.token)
        .resolves(lessonMaterial)
      MutableContainer.set(CmsContentProvider, cmsContentProvider)

      gqlRoom = await roomQuery(roomId, endUser)
    })

    after(async () => await dbDisconnect())

    it('returns room with expected id', async () => {
      expect(gqlRoom).to.not.be.null
      expect(gqlRoom).to.not.be.undefined
      expect(gqlRoom?.room_id).to.equal(roomId)
    })

    it('returns room.scores with length of 1', async () => {
      const gqlScores = gqlRoom?.scores
      expect(gqlScores).to.have.lengthOf(1)
    })

    it('returns room.scores[0].teacherScores with length of 0', async () => {
      const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
      expect(gqlTeacherScores).to.have.lengthOf(0)
    })

    it('returns expected room.scores[0].user', async () => {
      const score = gqlRoom?.scores?.[0]
      const gqlStudent = score?.user
      const expectedStudent: FindConditions<GqlUser> = {
        user_id: student.userId,
        given_name: null,
        family_name: null,
      }
      expect(gqlStudent).to.deep.equal(expectedStudent)
    })

    it('returns expected room.scores[0].content', async () => {
      const gqlContent = gqlRoom?.scores?.[0]?.content
      const expectedContent: FindConditions<GqlContent> = {
        content_id: lessonMaterial.contentId,
        subcontent_id: null,
        h5p_id: null,
        parent_id: null,
        name: lessonMaterial.name,
        type: FileType[FileType.Audio],
        fileType: FileType[FileType.Audio],
      }
      expect(gqlContent).to.deep.equal(expectedContent)
    })

    it('returns expected room.scores[0].score', async () => {
      const gqlScore = gqlRoom?.scores?.[0]?.score
      const expectedScore: FindConditions<GqlScoreSummary> = {
        max: null,
        min: null,
        mean: null,
        median: null,
        medians: [],
        scoreFrequency: 0,
        scores: [],
        sum: 0,
      }
      expect(gqlScore).to.deep.include(expectedScore)
    })

    it('returns room.scores[0].score.answers with length of 0', async () => {
      const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
      expect(gqlAnswers).to.have.lengthOf(0)
    })

    it('returns room.teacherComments with length of 0', async () => {
      const gqlComments = gqlRoom?.teacherComments
      expect(gqlComments).to.have.lengthOf(0)
    })

    it('returns room.teacherCommentsByStudent with length of 0', async () => {
      const gqlComments = gqlRoom?.teacherCommentsByStudent
      expect(gqlComments).to.have.lengthOf(0)
    })

    it('DB: adds 1 Room entry', async () => {
      const dbRooms = await roomRepo().find()
      expect(dbRooms).to.have.lengthOf(1)
    })

    it('DB: Room has expected values', async () => {
      const dbRoom = await roomRepo().findOneOrFail()

      const expected: FindConditions<Room> = {
        roomId: roomId,
        startTime: null,
        endTime: null,
        attendanceCount: 2,
      }

      expect(dbRoom).to.deep.include(expected)
    })

    it('DB: adds 1 UserContentScore entry', async () => {
      const dbUserContentScores = await userContentScoreRepo().find()
      expect(dbUserContentScores).to.have.lengthOf(1)
    })

    it('DB: UserContentScore has expected values', async () => {
      const dbUserContentScore = await userContentScoreRepo().findOneOrFail()

      const expected: FindConditions<UserContentScore> = {
        roomId: roomId,
        studentId: student.userId,
        contentKey: lessonMaterial.contentId,
        contentName: null, // The gql result uses the cms content name as fallback.
        contentType: null, // The gql result uses the cms FileType as fallback.
        seen: false,
      }

      expect(dbUserContentScore).to.deep.include(expected)
    })

    it('DB: adds 0 Answer entries', async () => {
      const dbAnswers = await answerRepo().find()
      expect(dbAnswers).to.have.lengthOf(0)
    })
  })

  // TODO
  context.skip(
    '1 student, 1 xapi event, 1 TeacherScore, 1 TeacherComment',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let teacherScore: TeacherScore
      let teacherComment: TeacherComment
      let existingUcs: UserContentScore
      let ucsTemplate: UserContentScore
      let answer: Answer
      const h5pId = 'h5p1'
      const contentName = 'My Flashcards'
      const contentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()

        const ucsBuilder = new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey()
          .withContentName(contentName)
          .withContentType(contentType)
        existingUcs = ucsBuilder.withSeen(true).build()
        ucsTemplate = ucsBuilder.withSeen(false).build()

        answer = new AnswerBuilder(existingUcs)
          .withScore({ min: 0, max: 5, raw: 4 })
          .withResponse(undefined)
          .build()
        existingUcs.answers = Promise.resolve([answer])
        const room = await new RoomBuilder()
          .withRoomId(roomId)
          .withUcs([existingUcs])
          .buildAndPersist()

        teacherScore = await new TeacherScoreBuilder(existingUcs)
          .withTeacherId(endUser.userId)
          .buildAndPersist()
        teacherComment = await new TeacherCommentBuilder()
          .withRoomId(roomId)
          .withTeacherId(endUser.userId)
          .withStudentId(student.userId)
          .buildAndPersist()
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const h5pContentProvider = Substitute.for<H5pContentProvider>()
        h5pContentProvider
          .getH5pContents(Arg.any(), endUser.token)
          .resolves(
            new Map([
              [h5pId, { id: h5pId, type: contentType, subContents: [] }],
            ]),
          )
        MutableContainer.set(H5pContentProvider, h5pContentProvider)

        lessonMaterial = new LessonMaterialBuilder()
          .withSource(FileType.H5P, h5pId)
          .withName(contentName)
          .build()
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterials(roomId, endUser.token).resolves({
          contents: new Map([
            [
              lessonMaterial.contentId,
              { content: lessonMaterial, subContents: [] },
            ],
          ]),
          studentContentMap: [
            {
              studentId: student.userId,
              contentIds: [lessonMaterial.contentId],
            },
          ],
        })
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        gqlRoom = await roomQuery(roomId, endUser)
      })

      after(async () => await dbDisconnect())

      it('returns room with expected id', async () => {
        expect(gqlRoom).to.not.be.null
        expect(gqlRoom).to.not.be.undefined
        expect(gqlRoom?.room_id).to.equal(roomId)
      })

      it('returns room.teacherComments with length of 1', async () => {
        const gqlTeacherComments = gqlRoom?.teacherComments
        expect(gqlTeacherComments).to.have.lengthOf(1)
      })

      it('returns expected room.teacherComments[0]', async () => {
        const actual = gqlRoom?.teacherComments?.[0]
        const expected: FindConditions<GqlTeacherComment> = {
          date: teacherComment.date.getTime(),
          lastUpdated: teacherComment.lastUpdated.getTime(),
          comment: teacherComment.comment,
          student: {
            user_id: student.userId,
            given_name: null,
            family_name: null,
          },
          teacher: {
            user_id: endUser.userId,
            given_name: null,
            family_name: null,
          },
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.teacherCommentsByStudent with length of 1', async () => {
        const gqlComments = gqlRoom?.teacherCommentsByStudent
        expect(gqlComments).to.have.lengthOf(1)
      })

      it('returns expected room.teacherCommentsByStudent[0]', async () => {
        const actual = gqlRoom?.teacherCommentsByStudent?.[0]
        const expected: FindConditions<GqlTeacherCommentsByStudent> = {
          student: {
            user_id: student.userId,
            given_name: null,
            family_name: null,
          },
          teacherComments: [
            {
              date: teacherComment.date.getTime(),
              lastUpdated: teacherComment.lastUpdated.getTime(),
              comment: teacherComment.comment,
              student: {
                user_id: student.userId,
                given_name: null,
                family_name: null,
              },
              teacher: {
                user_id: endUser.userId,
                given_name: null,
                family_name: null,
              },
            },
          ],
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.scores[0].teacherScores with length of 1', async () => {
        const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
        expect(gqlTeacherScores).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].teacherScores[0]', async () => {
        const actual = gqlRoom?.scores?.[0].teacherScores?.[0]
        const expected: FindConditions<GqlTeacherScore> = {
          date: teacherScore.date.getTime(),
          score: 1,
          student: {
            user_id: student.userId,
            given_name: null,
            family_name: null,
          },
          teacher: {
            user_id: endUser.userId,
            given_name: null,
            family_name: null,
          },
          content: {
            content_id: lessonMaterial.contentId,
            subcontent_id: lessonMaterial.subcontentId ?? null,
            h5p_id: lessonMaterial.h5pId,
            parent_id: null,
            name: contentName,
            type: contentType,
            fileType: FileType[FileType.H5P],
          },
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.scores with length of 1', async () => {
        const gqlScores = gqlRoom?.scores
        expect(gqlScores).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].user', async () => {
        const score = gqlRoom?.scores?.[0]
        const gqlStudent = score?.user
        const expectedStudent: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: null,
          family_name: null,
        }
        expect(gqlStudent).to.deep.equal(expectedStudent)
      })

      it('returns expected room.scores[0].content', async () => {
        const gqlContent = gqlRoom?.scores?.[0]?.content
        const expectedContent: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: lessonMaterial.subcontentId ?? null,
          h5p_id: lessonMaterial.h5pId,
          parent_id: null,
          name: contentName,
          type: contentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
        const expectedScore: FindConditions<GqlScoreSummary> = {
          max: 4,
          min: 4,
          mean: 4,
          median: 4,
          medians: [4],
          scoreFrequency: 1,
          scores: [4],
          sum: 4,
        }
        expect(gqlScore).to.deep.include(expectedScore)
      })

      it('returns room.scores[0].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        const expectedAnswers: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: answer.date.getTime(),
            maximumPossibleScore: 5,
            minimumPossibleScore: 0,
            score: 4,
          },
        ]
        expect(gqlAnswers).to.deep.equal(expectedAnswers)
      })

      it('DB: adds 1 Room entry', async () => {
        const dbRooms = await roomRepo().find()
        expect(dbRooms).to.have.lengthOf(1)
      })

      it('DB: Room has expected values', async () => {
        const dbRoom = await roomRepo().findOneOrFail()

        const expected: FindConditions<Room> = {
          roomId: roomId,
          startTime: null,
          endTime: null,
          attendanceCount: null,
        }

        expect(dbRoom).to.deep.include(expected)
      })

      it('DB: adds 1 UserContentScore entry', async () => {
        const dbUserContentScores = await userContentScoreRepo().find()
        expect(dbUserContentScores).to.have.lengthOf(1)
      })

      it('DB: UserContentScore has expected values', async () => {
        const dbUserContentScore = await userContentScoreRepo().findOneOrFail()

        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: h5pId,
          contentName: contentName,
          contentType: contentType,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 1 Answer entry', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(1)
      })

      it('DB: 1 TeacherScore', async () => {
        const dbScores = await teacherScoreRepo().find()
        expect(dbScores).to.have.lengthOf(1)
      })

      it('DB: TeacherScore not modified except for lastUpdated and version', async () => {
        const dbTeacherScore = await teacherScoreRepo().findOneOrFail()
        const expected: FindConditions<TeacherScore> = {
          roomId: teacherScore.roomId,
          contentKey: teacherScore.contentKey,
          studentId: teacherScore.studentId,
          teacherId: teacherScore.teacherId,
          date: teacherScore.date,
          score: teacherScore.score,
        }
        expect(dbTeacherScore).to.deep.include(expected)
      })

      it('DB: 1 TeacherComment', async () => {
        const dbComments = await teacherCommentRepo().find()
        expect(dbComments).to.have.lengthOf(1)
      })

      it('DB: TeacherComment not modified', async () => {
        const dbTeacherComment = await teacherCommentRepo().findOneOrFail()
        expect(dbTeacherComment).to.deep.include(teacherComment)
      })
    },
  )
})
