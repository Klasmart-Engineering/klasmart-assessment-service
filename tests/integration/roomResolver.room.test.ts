import { v4 } from 'uuid'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { FindConditions, getRepository } from 'typeorm'
import { Container as MutableContainer } from 'typedi'

import expect from '../utils/chaiAsPromisedSetup'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import { TestTitle } from '../utils/testTitles'
import { XApiRecord } from '../../src/db/xapi'
import '../utils/globalIntegrationTestHooks'
import EndUser from '../entities/endUser'

import {
  dbConnect,
  dbDisconnect,
  createSubstitutesToExpectedInjectableServices,
} from '../utils/globalIntegrationTestHooks'
import { Content } from '../../src/db/cms/entities/content'
import { FileType } from '../../src/db/cms/enums/fileType'
import {
  GqlUser,
  GqlContent,
  GqlScoreSummary,
  GqlAnswer,
  GqlTeacherScore,
  GqlTeacherComment,
  GqlTeacherCommentsByStudent,
} from '../queriesAndMutations/gqlInterfaces'
import {
  GqlRoom,
  roomQuery,
  roomQueryWithCookie,
} from '../queriesAndMutations/roomOps'
import {
  AnswerBuilder,
  AttendanceBuilder,
  EndUserBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  RoomBuilder,
  ScheduleBuilder,
  TeacherScoreBuilder,
  UserBuilder,
  UserContentScoreBuilder,
  XApiRecordBuilder,
} from '../builders'
import {
  Answer,
  Room,
  TeacherComment,
  TeacherScore,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import TeacherCommentBuilder from '../builders/teacherCommentBuilder'
import ContentKey from '../../src/helpers/contentKey'
import { CmsScheduleProvider } from '../../src/providers/cmsScheduleProvider'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
import { throwExpression } from '../../src/helpers/throwExpression'
import { User } from '../../src/web/user'
import DiKeys from '../../src/initialization/diKeys'
import { generateBatchFetchUserRepsonse } from '../utils/batchedResponses'

/**
 * - scores 0 the first time
 * - room/ucs/answer exist (update), make sure teacher scores and comments don't get wiped out
 * - multiple-hotspot scoring
 * - non-h5p materials
 * - user content score ordering
 * - include user content scores for students with no events
 * - multiple students
 * - multiple contents
 * - xapi event not part of lesson plan
 * - score and response are null
 * - response is included but score is not
 * - subcontentId
 * TODO:
 * - specify expected xapi timestamps
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

      const roomId = 'room1'
      const { userApi } = createSubstitutesToExpectedInjectableServices()
      const endUser = new EndUserBuilder().dontAuthenticate().build()
      userApi
        .batchFetchUsers([endUser.userId], Arg.any())
        .resolves(generateBatchFetchUserRepsonse([endUser]))

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
      const { userApi } = createSubstitutesToExpectedInjectableServices()
      const endUser = new EndUserBuilder().expiredToken().build()
      userApi
        .batchFetchUsers([endUser.userId], endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser]))

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
        createSubstitutesToExpectedInjectableServices()
        MutableContainer.set(DiKeys.CmsApiUrl, 'https://cms.dummyurl.net')

        const roomId = 'room1'
        const { userApi, attendanceApi } =
          createSubstitutesToExpectedInjectableServices()
        const endUser = new EndUserBuilder().authenticate().build()
        userApi
          .batchFetchUsers([endUser.userId], endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser]))

        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .rejects(ErrorMessage.scheduleNotFound(roomId))
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)
        attendanceApi.getRoomAttendances(roomId).resolves([])

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
      createSubstitutesToExpectedInjectableServices()
      MutableContainer.set(DiKeys.CmsApiUrl, 'https://cms.dummyurl.net')

      const roomId = 'room1'
      const { userApi, attendanceApi } =
        createSubstitutesToExpectedInjectableServices()
      const endUser = new EndUserBuilder().authenticate().build()
      userApi
        .batchFetchUsers([endUser.userId], endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser]))

      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider
        .getSchedule(roomId, endUser.token)
        .rejects(ErrorMessage.scheduleNotFound(roomId))
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)
      attendanceApi.getRoomAttendances(roomId).resolves([])

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.scheduleNotFound(roomId),
      )
    })

    after(async () => await dbDisconnect())
  })

  context('1 student, 1 xapi "score" event', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XApiRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const score = { min: 0, max: 2, raw: 1 }

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      // can't pass a list of multiple user_ids as mocked Arg because Substitute expects a primitive value
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([xapiRecord])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
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
        given_name: student.givenName,
        family_name: student.familyName,
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

    it('returns expected room.scores[0].score', async () => {
      const actual = gqlRoom?.scores?.[0]?.score
      const expected: FindConditions<GqlScoreSummary> = {
        max: score.raw,
        min: score.raw,
        mean: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        median: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        medians: [xapiRecord.xapi?.data?.statement?.result?.score?.raw],
        scoreFrequency: 1,
        scores: [xapiRecord.xapi?.data?.statement?.result?.score?.raw],
        sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
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
      const dbRooms = await roomRepo().count()
      expect(dbRooms).to.equal(1)
    })

    it('DB: Room has expected values', async () => {
      const actual = await roomRepo().findOneOrFail()
      const expected: FindConditions<Room> = {
        roomId: roomId,
        startTime: null,
        endTime: null,
        attendanceCount: 2,
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
        contentName: xapiContentName,
        contentType: xapiContentType,
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
        answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
        date: new Date(xapiRecord.xapi?.clientTimestamp ?? 0),
        maximumPossibleScore: score.max,
        minimumPossibleScore: score.min,
        score: 1,
      }

      expect(dbAnswer).to.deep.include(expected)
    })
  })

  context('1 student, 1 xapi "score" event; result is cached', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XApiRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const score = { min: 0, max: 2, raw: 1 }

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([xapiRecord])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
      cmsContentProvider
        .getLessonMaterial(lessonMaterial.contentId, endUser.token)
        .resolves(lessonMaterial)
      MutableContainer.set(CmsContentProvider, cmsContentProvider)

      // cached room
      const existingRoom = new RoomBuilder()
        .withRoomId(roomId)
        .withAttendanceCount(2)
        .build()
      const existingUserContentScore = new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentKey(lessonMaterial.contentId)
        .withContentName(xapiContentName)
        .withContentType(xapiContentType)
        .withSeen(true)
        .build()
      const existingAnswer = new AnswerBuilder(existingUserContentScore)
        .withScore(score)
        .withDate(new Date(xapiRecord.xapi?.clientTimestamp ?? 0))
        .withResponse(undefined)
        .build()
      existingUserContentScore.answers = Promise.resolve([existingAnswer])
      existingRoom.scores = Promise.resolve([existingUserContentScore])
      await roomRepo().save(existingRoom)

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
        given_name: student.givenName,
        family_name: student.familyName,
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

    it('returns expected room.scores[0].score', async () => {
      const actual = gqlRoom?.scores?.[0]?.score
      const expected: FindConditions<GqlScoreSummary> = {
        max: score.raw,
        min: score.raw,
        mean: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        median: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        medians: [xapiRecord.xapi?.data?.statement?.result?.score?.raw],
        scoreFrequency: 1,
        scores: [xapiRecord.xapi?.data?.statement?.result?.score?.raw],
        sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
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
      const dbRooms = await roomRepo().count()
      expect(dbRooms).to.equal(1)
    })

    it('DB: Room has expected values', async () => {
      const actual = await roomRepo().findOneOrFail()
      const expected: FindConditions<Room> = {
        roomId: roomId,
        startTime: null,
        endTime: null,
        attendanceCount: 2,
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
        contentName: xapiContentName,
        contentType: xapiContentType,
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
        answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
        date: new Date(xapiRecord.xapi?.clientTimestamp ?? 0),
        maximumPossibleScore: score.max,
        minimumPossibleScore: score.min,
        score: 1,
      }

      expect(dbAnswer).to.deep.include(expected)
    })
  })

  context('1 student, 1 xapi "answer" event', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XApiRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const response = 'Badanamu'

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(undefined)
        .withResponse(response)
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([xapiRecord])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
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
        given_name: student.givenName,
        family_name: student.familyName,
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
          date: xapiRecord.xapi?.clientTimestamp,
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
        attendanceCount: 2,
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
        contentName: xapiContentName,
        contentType: xapiContentType,
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
        answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
        date: new Date(xapiRecord.xapi?.clientTimestamp ?? 0),
        maximumPossibleScore: null,
        minimumPossibleScore: null,
        score: null,
      }

      expect(dbAnswer).to.deep.include(expected)
    })
  })

  context('1 student, 1 xapi "attempted" event', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XApiRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const eventVerb = 'attempted'

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withVerb(eventVerb)
        .withScore(undefined)
        .withResponse(undefined)
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([xapiRecord])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
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
        given_name: student.givenName,
        family_name: student.familyName,
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
      const dbRooms = await roomRepo().count()
      expect(dbRooms).to.equal(1)
    })

    it('DB: Room has expected values', async () => {
      const actual = await roomRepo().findOneOrFail()
      const expected: FindConditions<Room> = {
        roomId: roomId,
        startTime: null,
        endTime: null,
        attendanceCount: 2,
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
        contentName: xapiContentName,
        contentType: xapiContentType,
        seen: true,
      }
      expect(actual).to.deep.include(expected)
    })

    it('DB: adds 0 Answer entries', async () => {
      const dbAnswers = await answerRepo().count()
      expect(dbAnswers).to.equal(0)
    })
  })

  context(
    '1 student, 1 xapi "score" event for subcontent1, 1 xapi "score" event for subcontent2',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecord1: XApiRecord
      let xapiRecord2: XApiRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'
      const subcontent1Id = v4()
      const subcontent2Id = v4()

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        xapiRecord1 = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pSubId(subcontent1Id)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore({ min: 0, max: 2, raw: 1 })
          .build()
        xapiRecord2 = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pSubId(subcontent2Id)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore({ min: 0, max: 2, raw: 1 })
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord1, xapiRecord2])
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial])
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
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].user', async () => {
        const actual = gqlRoom?.scores?.[1]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].user', async () => {
        const actual = gqlRoom?.scores?.[2]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
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
          type: FileType[FileType.H5P],
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
          name: xapiContentName,
          type: xapiContentType,
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
          name: xapiContentName,
          type: xapiContentType,
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
          max: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          min: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          mean: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          median: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          medians: [xapiRecord1.xapi?.data?.statement?.result?.score?.raw],
          scoreFrequency: 1,
          scores: [xapiRecord1.xapi?.data?.statement?.result?.score?.raw],
          sum: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns expected room.scores[2].score', async () => {
        const actual = gqlRoom?.scores?.[2]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          min: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          mean: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          median: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          medians: [xapiRecord2.xapi?.data?.statement?.result?.score?.raw],
          scoreFrequency: 1,
          scores: [xapiRecord2.xapi?.data?.statement?.result?.score?.raw],
          sum: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
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
            date: xapiRecord1.xapi?.clientTimestamp,
            maximumPossibleScore:
              xapiRecord1.xapi?.data?.statement?.result?.score?.max,
            minimumPossibleScore:
              xapiRecord1.xapi?.data?.statement?.result?.score?.min,
            score: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          },
        ]
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].score.answers', async () => {
        const actual = gqlRoom?.scores?.[2]?.score?.answers
        const expected: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: xapiRecord2.xapi?.clientTimestamp,
            maximumPossibleScore:
              xapiRecord2.xapi?.data?.statement?.result?.score?.max,
            minimumPossibleScore:
              xapiRecord2.xapi?.data?.statement?.result?.score?.min,
            score: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
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
          attendanceCount: 2,
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
          contentName: null, // TODO: Will change after FieldResolver is added.
          contentType: null, // TODO: Will change after FieldResolver is added.
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
          contentName: xapiContentName,
          contentType: xapiContentType,
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
          contentName: xapiContentName,
          contentType: xapiContentType,
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
          answer: xapiRecord1.xapi?.data?.statement?.result?.response ?? null,
          date: new Date(xapiRecord1.xapi?.clientTimestamp ?? 0),
          maximumPossibleScore: 2,
          minimumPossibleScore: 0,
          score: 1,
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
          answer: xapiRecord2.xapi?.data?.statement?.result?.response ?? null,
          date: new Date(xapiRecord2.xapi?.clientTimestamp ?? 0),
          maximumPossibleScore: 2,
          minimumPossibleScore: 0,
          score: 1,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  context(
    '1 student, 1 xapi "score" event, 3 overlapping attendance sessions with same id',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecord: XApiRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        xapiRecord = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore({ min: 0, max: 2, raw: 1 })
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord])
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial])
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
          given_name: student.givenName,
          family_name: student.familyName,
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
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
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

      it('returns room.scores[0].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        const expectedAnswers: FindConditions<GqlAnswer>[] = [
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
        expect(gqlAnswers).to.deep.equal(expectedAnswers)
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
          contentName: xapiContentName,
          contentType: xapiContentType,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 1 Answer entry', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(1)
      })

      it('DB: Answer has expected values', async () => {
        const dbAnswer = await answerRepo().findOneOrFail()

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
          date: new Date(xapiRecord.xapi?.clientTimestamp ?? 0),
          maximumPossibleScore: 2,
          minimumPossibleScore: 0,
          score: 1,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  context(
    '1 student, 1 xapi "score" event for 2nd material, 1 xapi "score" event for 1st material (in that order)',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial1: Content
      let lessonMaterial2: Content
      let xapiRecord1: XApiRecord
      let xapiRecord2: XApiRecord
      const xapiContent1Name = 'Material 1'
      const xapiContent1Type = 'Flashcards'
      const xapiContent2Name = 'Material 2'
      const xapiContent2Type = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])
        lessonMaterial1 = new LessonMaterialBuilder()
          .withName(xapiContent1Name)
          .build()
        lessonMaterial2 = new LessonMaterialBuilder()
          .withName(xapiContent2Name)
          .build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial1.contentId)
          .addMaterialId(lessonMaterial2.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        xapiRecord1 = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial1.h5pId)
          .withH5pName(xapiContent1Name)
          .withH5pType(xapiContent1Type)
          .withScore({ min: 0, max: 10, raw: 5 })
          .build()
        xapiRecord2 = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial2.h5pId)
          .withH5pName(xapiContent2Name)
          .withH5pType(xapiContent2Type)
          .withScore({ min: 0, max: 15, raw: 15 })
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord2, xapiRecord1])
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial1, lessonMaterial2])
        cmsContentProvider
          .getLessonMaterial(lessonMaterial1.contentId, endUser.token)
          .resolves(lessonMaterial1)
        cmsContentProvider
          .getLessonMaterial(lessonMaterial2.contentId, endUser.token)
          .resolves(lessonMaterial2)
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
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].user', async () => {
        const actual = gqlRoom?.scores?.[1]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].content', async () => {
        const actual = gqlRoom?.scores?.[0]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial1.contentId,
          subcontent_id: null,
          h5p_id: lessonMaterial1.h5pId,
          parent_id: null,
          name: xapiContent1Name,
          type: xapiContent1Type,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].content', async () => {
        const actual = gqlRoom?.scores?.[1]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial2.contentId,
          subcontent_id: null,
          h5p_id: lessonMaterial2.h5pId,
          parent_id: null,
          name: xapiContent2Name,
          type: xapiContent2Type,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].score', async () => {
        const actual = gqlRoom?.scores?.[0]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          min: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          mean: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          median: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          medians: [xapiRecord1.xapi?.data?.statement?.result?.score?.raw],
          scoreFrequency: 1,
          scores: [xapiRecord1.xapi?.data?.statement?.result?.score?.raw],
          sum: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns expected room.scores[1].score', async () => {
        const actual = gqlRoom?.scores?.[1]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          min: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          mean: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          median: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          medians: [xapiRecord2.xapi?.data?.statement?.result?.score?.raw],
          scoreFrequency: 1,
          scores: [xapiRecord2.xapi?.data?.statement?.result?.score?.raw],
          sum: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
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
            date: xapiRecord1.xapi?.clientTimestamp,
            maximumPossibleScore:
              xapiRecord1.xapi?.data?.statement?.result?.score?.max,
            minimumPossibleScore:
              xapiRecord1.xapi?.data?.statement?.result?.score?.min,
            score: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          },
        ]
        expect(actual).to.deep.equal(expected)
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
            date: xapiRecord2.xapi?.clientTimestamp,
            maximumPossibleScore:
              xapiRecord2.xapi?.data?.statement?.result?.score?.max,
            minimumPossibleScore:
              xapiRecord2.xapi?.data?.statement?.result?.score?.min,
            score: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
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
        const count = await roomRepo().count()
        expect(count).to.equal(1)
      })

      it('DB: Room has expected values', async () => {
        const actual = await roomRepo().findOneOrFail()
        const expected: FindConditions<Room> = {
          roomId: roomId,
          startTime: null,
          endTime: null,
          attendanceCount: 2,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 2 UserContentScore entries', async () => {
        const count = await userContentScoreRepo().count()
        expect(count).to.equal(2)
      })

      it('DB: UserContentScore[0] has expected values', async () => {
        const actual = await userContentScoreRepo().findOneOrFail({
          where: { contentKey: lessonMaterial1.contentId },
        })
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial1.contentId,
          contentName: xapiContent1Name,
          contentType: xapiContent1Type,
          seen: true,
        }

        expect(actual).to.deep.include(expected)
      })

      it('DB: UserContentScore[1] has expected values', async () => {
        const actual = await userContentScoreRepo().findOneOrFail({
          where: { contentKey: lessonMaterial2.contentId },
        })
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial2.contentId,
          contentName: xapiContent2Name,
          contentType: xapiContent2Type,
          seen: true,
        }

        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 2 Answer entries', async () => {
        const count = await answerRepo().count()
        expect(count).to.equal(2)
      })

      it('DB: Answer 1 has expected values', async () => {
        const contentKey = lessonMaterial1.contentId
        const dbAnswer = await answerRepo().findOneOrFail({
          where: { contentKey },
        })

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          answer: xapiRecord1.xapi?.data?.statement?.result?.response ?? null,
          date: new Date(xapiRecord1.xapi?.clientTimestamp ?? 0),
          maximumPossibleScore: 10,
          minimumPossibleScore: 0,
          score: 5,
        }

        expect(dbAnswer).to.deep.include(expected)
      })

      it('DB: Answer 2 has expected values', async () => {
        const contentKey = lessonMaterial2.contentId
        const dbAnswer = await answerRepo().findOneOrFail({
          where: { contentKey },
        })

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          answer: xapiRecord2.xapi?.data?.statement?.result?.response ?? null,
          date: new Date(xapiRecord2.xapi?.clientTimestamp ?? 0),
          maximumPossibleScore: 15,
          minimumPossibleScore: 0,
          score: 15,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  context('1 student, 2 xapi "score" events', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XApiRecord
    let xapiRecord2: XApiRecord
    const xapiTimestamp1 = Date.now()
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore({ raw: 0, min: 0, max: 3 })
        .withServerTimestamp(xapiTimestamp1)
        .withClientTimestamp(xapiTimestamp1)
        .build()
      xapiRecord2 = new XApiRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withServerTimestamp(xapiTimestamp1 + 1)
        .withClientTimestamp(xapiTimestamp1 + 1)
        .withScore({ raw: 2, min: 0, max: 3 })
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([xapiRecord, xapiRecord2])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
      cmsContentProvider
        .getLessonMaterial(lessonMaterial.contentId, endUser.token)
        .resolves(lessonMaterial)
      MutableContainer.set(CmsContentProvider, cmsContentProvider)
    })

    after(async () => await dbDisconnect())

    it('returns room with expected id', async () => {
      // Act
      gqlRoom = await roomQuery(roomId, endUser)

      // Assert
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
        given_name: student.givenName,
        family_name: student.familyName,
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
        name: xapiContentName,
        type: xapiContentType,
        fileType: FileType[FileType.H5P],
      }
      expect(gqlContent).to.deep.equal(expectedContent)
    })

    it('returns expected room.scores[0].score.scores', async () => {
      const gqlScores = gqlRoom?.scores?.[0]?.score?.scores
      const expectedScore1 =
        xapiRecord.xapi?.data?.statement?.result?.score?.raw
      const expectedScore2 =
        xapiRecord2.xapi?.data?.statement?.result?.score?.raw
      expect(gqlScores).to.deep.equal([expectedScore1, expectedScore2])
    })

    it('returns room.scores[0].score.answers with length of 2', async () => {
      const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
      expect(gqlAnswers).to.have.lengthOf(2)
    })

    it('returns expected room.scores[0].score.answers', async () => {
      const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
      const answer1 = gqlAnswers?.[0].score
      const answer2 = gqlAnswers?.[1].score
      const expectedAnswer1 = 0
      const expectedAnswer2 = 2
      expect(answer1).to.equal(expectedAnswer1)
      expect(answer2).to.equal(expectedAnswer2)
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
      const roomCount = await roomRepo().count()
      expect(roomCount).to.equal(1)
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
      const count = await userContentScoreRepo().count()
      expect(count).to.equal(1)
    })

    it('DB: UserContentScore has expected values', async () => {
      const dbUserContentScore = await userContentScoreRepo().findOneOrFail()

      const expected: FindConditions<UserContentScore> = {
        roomId: roomId,
        studentId: student.userId,
        contentKey: lessonMaterial.contentId,
        contentName: xapiContentName,
        contentType: xapiContentType,
        seen: true,
      }

      expect(dbUserContentScore).to.deep.include(expected)
    })

    it('DB: adds 2 Answer entries', async () => {
      const answerCount = await answerRepo().count()
      expect(answerCount).to.equal(2)
    })

    it('DB: Answer 1 has expected values', async () => {
      const dbAnswer = await answerRepo().findOneOrFail({
        where: { timestamp: xapiRecord2.xapi?.clientTimestamp },
      })

      const expected: FindConditions<Answer> = {
        roomId: roomId,
        studentId: student.userId,
        contentKey: lessonMaterial.contentId,
        answer: xapiRecord2.xapi?.data?.statement?.result?.response ?? null,
        maximumPossibleScore: 3,
        minimumPossibleScore: 0,
        score: 2,
      }

      expect(dbAnswer).to.deep.include(expected)
    })

    it('DB: Answer 2 has expected values', async () => {
      const dbAnswer = await answerRepo().findOneOrFail({
        where: { timestamp: xapiRecord.xapi?.clientTimestamp },
      })

      const expected: FindConditions<Answer> = {
        roomId: roomId,
        studentId: student.userId,
        contentKey: lessonMaterial.contentId,
        answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
        maximumPossibleScore: 3,
        minimumPossibleScore: 0,
        score: 0,
      }

      expect(dbAnswer).to.deep.include(expected)
    })
  })

  context(
    '1 student, 1 xapi "score" event which is not part of the lesson plan',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial1: Content
      let lessonMaterial2: Content
      let xapiRecord: XApiRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial1 = new LessonMaterialBuilder().build()
        lessonMaterial2 = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial2.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        xapiRecord = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial1.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord])
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial2])
        cmsContentProvider
          .getLessonMaterial(lessonMaterial2.contentId, endUser.token)
          .resolves(lessonMaterial2)
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
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].content', async () => {
        const actual = gqlRoom?.scores?.[0]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial2.contentId,
          subcontent_id: lessonMaterial2.subcontentId ?? null,
          h5p_id: lessonMaterial2.h5pId,
          parent_id: null,
          name: lessonMaterial2.name,
          type: FileType[FileType.H5P],
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
        const count = await roomRepo().count()
        expect(count).to.equal(1)
      })

      it('DB: Room has expected values', async () => {
        const actual = await roomRepo().findOneOrFail()
        const expected: FindConditions<Room> = {
          roomId: roomId,
          startTime: null,
          endTime: null,
          attendanceCount: 2,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 1 UserContentScore entry', async () => {
        const count = await userContentScoreRepo().count()
        expect(count).to.equal(1)
      })

      it('DB: UserContentScore has expected values', async () => {
        const actual = await userContentScoreRepo().findOneOrFail()
        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial2.contentId,
          contentName: null,
          contentType: null,
          seen: false,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 0 Answer entries', async () => {
        const count = await answerRepo().count()
        expect(count).to.equal(0)
      })
    },
  )

  context('student1 0 xapi events; student2 1 xapi "score" event', () => {
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
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student1 = new UserBuilder().build()
      student2 = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student1, student2]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const student1Attendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student1.userId)
        .build()
      const student2Attendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student2.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, student1Attendance, student2Attendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRecord = new XApiRecordBuilder()
        .withUserId(student2.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore({ min: 0, max: 2, raw: 1 })
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student1.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student2.userId, Arg.any(), Arg.any())
        .resolves([xapiRecord])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
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
        given_name: student1.givenName,
        family_name: student1.familyName,
      }
      expect(actual).to.deep.equal(expected)
    })

    it('returns expected room.scores[1].user', async () => {
      const actual = gqlRoom?.scores?.[1]?.user
      const expected: FindConditions<GqlUser> = {
        user_id: student2.userId,
        given_name: student2.givenName,
        family_name: student2.familyName,
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

  context('1 student, 1 h5p material, 0 xapi events', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
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
        given_name: student.givenName,
        family_name: student.familyName,
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
        name: lessonMaterial.name,
        type: FileType[FileType.H5P],
        fileType: FileType[FileType.H5P],
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

  context('1 student, 1 non-h5p material', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content

    before(async () => {
      // Arrange
      await dbConnect()
      const { attendanceApi, userApi, xapiRepository } =
        createSubstitutesToExpectedInjectableServices()

      endUser = new EndUserBuilder().authenticate().build()
      student = new UserBuilder().build()
      userApi
        .batchFetchUsers(Arg.any(), endUser.token)
        .resolves(generateBatchFetchUserRepsonse([endUser, student]))

      const endUserAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .build()
      const studentAttendance = new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .build()
      attendanceApi
        .getRoomAttendances(roomId)
        .resolves([endUserAttendance, studentAttendance])

      lessonMaterial = new LessonMaterialBuilder()
        .withSource(FileType.Audio)
        .build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()
      xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
      xapiRepository
        .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
        .resolves([])
      xapiRepository
        .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
        .resolves([])
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      cmsScheduleProvider.getSchedule(roomId, endUser.token).resolves(schedule)
      MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
        .resolves([lessonMaterial])
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
        given_name: student.givenName,
        family_name: student.familyName,
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

  context(
    '1 student, 1 xapi event, 1 UserContentScore, 1 TeacherScore, 1 TeacherComment',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecord: XApiRecord
      let teacherScore: TeacherScore
      let teacherComment: TeacherComment
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        xapiRecord = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore({ min: 0, max: 2, raw: 1 })
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord])
        const room = await new RoomBuilder()
          .withRoomId(roomId)
          .buildAndPersist()
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.contentId)
          .buildAndPersist()
        teacherScore = await new TeacherScoreBuilder(userContentScore)
          .withTeacherId(endUser.userId)
          .buildAndPersist()
        teacherComment = await new TeacherCommentBuilder()
          .withRoomId(roomId)
          .withTeacherId(endUser.userId)
          .withStudentId(student.userId)
          .buildAndPersist()
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial])
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        gqlRoom = await roomQuery(roomId, endUser)
        console.log(gqlRoom)
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
            given_name: student.givenName,
            family_name: student.familyName,
          },
          teacher: {
            user_id: endUser.userId,
            given_name: endUser.givenName,
            family_name: endUser.familyName,
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
            given_name: student.givenName,
            family_name: student.familyName,
          },
          teacherComments: [
            {
              date: teacherComment.date.getTime(),
              lastUpdated: teacherComment.lastUpdated.getTime(),
              comment: teacherComment.comment,
              student: {
                user_id: student.userId,
                given_name: student.givenName,
                family_name: student.familyName,
              },
              teacher: {
                user_id: endUser.userId,
                given_name: endUser.givenName,
                family_name: endUser.familyName,
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
          lastUpdated: teacherScore.lastUpdated.getTime(),
          score: 1,
          student: {
            user_id: student.userId,
            given_name: student.givenName,
            family_name: student.familyName,
          },
          teacher: {
            user_id: endUser.userId,
            given_name: endUser.givenName,
            family_name: endUser.familyName,
          },
          content: {
            content_id: lessonMaterial.contentId,
            subcontent_id: lessonMaterial.subcontentId ?? null,
            h5p_id: lessonMaterial.h5pId,
            parent_id: null,
            name: xapiContentName,
            type: xapiContentType,
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
          given_name: student.givenName,
          family_name: student.familyName,
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
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
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

      it('returns room.scores[0].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        const expectedAnswers: FindConditions<GqlAnswer>[] = [
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
          contentName: xapiContentName,
          contentType: xapiContentType,
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

      it('DB: TeacherScore not modified', async () => {
        const dbTeacherScore = await teacherScoreRepo().findOneOrFail()
        const expected: FindConditions<TeacherScore> = {
          roomId: teacherScore.roomId,
          contentKey: teacherScore.contentKey,
          studentId: teacherScore.studentId,
          teacherId: teacherScore.teacherId,
          date: teacherScore.date,
          lastUpdated: teacherScore.lastUpdated,
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

  context(
    '1 student, 5 multiple-hotspot xapi events (3 answered, 2 attempted)',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecords: XApiRecord[]
      const xapiContentName = 'My Multiple Hotspots'
      const xapiContentType = 'ImageMultipleHotspotQuestion'
      const scoreTimestamp1 = Date.now()
      const scoreTimestamp2 = Date.now() + 1000
      const scoreTimestamp3 = Date.now() + 2000

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        const xapiRecordBuilder = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withResponse(undefined)
        xapiRecords = [
          xapiRecordBuilder.withVerb('attempted').build(),
          xapiRecordBuilder
            .withVerb('answered')
            .withScore({ min: 0, max: 3, raw: 1 })
            .withServerTimestamp(scoreTimestamp1)
            .withClientTimestamp(scoreTimestamp1)
            .build(),
          xapiRecordBuilder
            .withVerb('answered')
            .withScore({ min: 0, max: 3, raw: 2 })
            .withServerTimestamp(scoreTimestamp2)
            .withClientTimestamp(scoreTimestamp2)
            .build(),
          xapiRecordBuilder.withVerb('attempted').withScore(undefined).build(),
          xapiRecordBuilder
            .withVerb('answered')
            .withScore({ min: 0, max: 3, raw: 0 })
            .withServerTimestamp(scoreTimestamp3)
            .withClientTimestamp(scoreTimestamp3)
            .build(),
        ]
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves(xapiRecords)
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial])
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
          given_name: student.givenName,
          family_name: student.familyName,
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
          name: xapiContentName ?? lessonMaterial.name,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
        const expectedScore: FindConditions<GqlScoreSummary> = {
          max: 2,
          min: 0,
          mean: 1,
          median: 2,
          medians: [0, 2],
          scoreFrequency: 2,
          scores: [2, 0],
          sum: 2,
        }
        expect(gqlScore).to.deep.include(expectedScore)
      })

      it('returns room.scores[0].score.answers with length of 2', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(2)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        const expectedAnswers: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: xapiRecords[1].xapi?.clientTimestamp,
            maximumPossibleScore: 3,
            minimumPossibleScore: 0,
            score: 2,
          },
          {
            answer: null,
            date: xapiRecords[4].xapi?.clientTimestamp,
            maximumPossibleScore: 3,
            minimumPossibleScore: 0,
            score: 0,
          },
        ]
        expect(gqlAnswers).to.deep.equal(expectedAnswers)
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
          contentName: xapiContentName,
          contentType: xapiContentType,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 2 Answer entries', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(2)
      })

      it('DB: Answer 1 has expected values', async () => {
        const dbAnswer = await answerRepo().findOneOrFail({
          where: { timestamp: scoreTimestamp1 },
        })

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          answer: null,
          maximumPossibleScore: 3,
          minimumPossibleScore: 0,
          score: 2,
        }

        expect(dbAnswer).to.deep.include(expected)
      })

      it('DB: Answer 2 has expected values', async () => {
        const dbAnswer = await answerRepo().findOneOrFail({
          where: { timestamp: scoreTimestamp3 },
        })

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.contentId,
          answer: null,
          maximumPossibleScore: 3,
          minimumPossibleScore: 0,
          score: 0,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  context(
    '[PRE CONTENT_ID MIGRATION] stored UserContentScore is using the h5pId',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecord: XApiRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .build()
        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        xapiRecord = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore({ min: 0, max: 2, raw: 1 })
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord])
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.h5pId) // using h5pId instead of contentId
          .withContentType(xapiContentType)
          .withContentName(xapiContentName)
          .buildAndPersist()
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial])
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        cmsContentProvider
          .getLessonMaterial(
            lessonMaterial.h5pId ?? throwExpression('h5pId is undefined'),
            endUser.token,
          )
          .resolves(undefined)
        cmsContentProvider
          .getLessonMaterialsWithSourceId(
            lessonMaterial.h5pId ?? throwExpression('h5pId is undefined'),
            endUser.token,
          )
          .resolves([lessonMaterial])
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        // Act
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
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(gqlStudent).to.deep.equal(expectedStudent)
      })

      it('returns expected room.scores[0].content', async () => {
        const gqlContent = gqlRoom?.scores?.[0]?.content
        const expectedContent: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: null,
          h5p_id: lessonMaterial.h5pId,
          parent_id: null,
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
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

      it('returns room.scores[0].score.answers with length of 1', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns expected room.scores[0].score.answers', async () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        const expectedAnswers: FindConditions<GqlAnswer>[] = [
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
        expect(gqlAnswers).to.deep.equal(expectedAnswers)
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

      it('DB: 1 UserContentScore entry exists', async () => {
        const dbUserContentScores = await userContentScoreRepo().find()
        expect(dbUserContentScores).to.have.lengthOf(1)
      })

      it('DB: UserContentScore has expected values', async () => {
        const dbUserContentScore = await userContentScoreRepo().findOneOrFail()

        const expected: FindConditions<UserContentScore> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId, // should still be using h5pId. otherwise the migration script will run into conflicts
          contentName: xapiContentName,
          contentType: xapiContentType,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 1 Answer entry', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(1)
      })

      it('DB: Answer has expected values', async () => {
        const dbAnswer = await answerRepo().findOneOrFail()

        const expected: FindConditions<Answer> = {
          roomId: roomId,
          studentId: student.userId,
          contentKey: lessonMaterial.h5pId,
          answer: xapiRecord.xapi?.data?.statement?.result?.response ?? null,
          date: new Date(xapiRecord.xapi?.clientTimestamp ?? 0),
          maximumPossibleScore: 2,
          minimumPossibleScore: 0,
          score: 1,
        }

        expect(dbAnswer).to.deep.include(expected)
      })
    },
  )

  // Makes sure 3 UserContentScores are returned and that both subcontents have the correct parent_id assigned.
  context(
    '1 student, 0 xapi events for subcontent1, 1 xapi "score" event for subcontent2; subcontent2 is child of subcontent1',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecord1: XApiRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'
      const subcontent1Id = v4()
      const subcontent2Id = v4()

      before(async () => {
        // Arrange
        await dbConnect()
        const { attendanceApi, userApi, xapiRepository } =
          createSubstitutesToExpectedInjectableServices()

        endUser = new EndUserBuilder().authenticate().build()
        student = new UserBuilder().build()
        userApi
          .batchFetchUsers(Arg.any(), endUser.token)
          .resolves(generateBatchFetchUserRepsonse([endUser, student]))

        const endUserAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .build()
        const studentAttendance = new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .build()
        attendanceApi
          .getRoomAttendances(roomId)
          .resolves([endUserAttendance, studentAttendance])

        lessonMaterial = new LessonMaterialBuilder().build()
        const lessonPlan = new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .build()
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterials(roomId, lessonPlan.contentId, endUser.token)
          .resolves([lessonMaterial])
        cmsContentProvider
          .getLessonMaterial(lessonMaterial.contentId, endUser.token)
          .resolves(lessonMaterial)
        MutableContainer.set(CmsContentProvider, cmsContentProvider)

        const schedule = new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .build()
        const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
        cmsScheduleProvider
          .getSchedule(roomId, endUser.token)
          .resolves(schedule)
        MutableContainer.set(CmsScheduleProvider, cmsScheduleProvider)

        xapiRecord1 = new XApiRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pSubId(subcontent2Id)
          .withH5pParentId(subcontent1Id)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withScore({ min: 0, max: 2, raw: 1 })
          .build()
        xapiRepository.searchXapiEventsWithRoomId(Arg.any()).resolves([])
        xapiRepository
          .groupSearchXApiEventsForUsers(Arg.any(), Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(endUser.userId, Arg.any(), Arg.any())
          .resolves([])
        xapiRepository
          .searchXApiEventsForUser(student.userId, Arg.any(), Arg.any())
          .resolves([xapiRecord1])

        gqlRoom = await roomQuery(roomId, endUser)
      })

      after(async () => await dbDisconnect())

      it('returns room with expected id', () => {
        expect(gqlRoom).to.not.be.null
        expect(gqlRoom).to.not.be.undefined
        expect(gqlRoom?.room_id).to.equal(roomId)
      })

      it('returns room.scores with length of 3', () => {
        const gqlScores = gqlRoom?.scores
        expect(gqlScores).to.have.lengthOf(3)
      })

      it('returns room.scores[0].teacherScores with length of 0', () => {
        const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
        expect(gqlTeacherScores).to.have.lengthOf(0)
      })

      it('returns expected room.scores[0].user', () => {
        const actual = gqlRoom?.scores?.[0]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].user', () => {
        const actual = gqlRoom?.scores?.[1]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].user', () => {
        const actual = gqlRoom?.scores?.[2]?.user
        const expected: FindConditions<GqlUser> = {
          user_id: student.userId,
          given_name: student.givenName,
          family_name: student.familyName,
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].content', () => {
        const actual = gqlRoom?.scores?.[0]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: null,
          h5p_id: lessonMaterial.h5pId,
          parent_id: null,
          name: lessonMaterial.name,
          type: FileType[FileType.H5P],
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[1].content', () => {
        const actual = gqlRoom?.scores?.[1]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: subcontent2Id,
          h5p_id: lessonMaterial.h5pId,
          parent_id: subcontent1Id,
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[2].content', () => {
        const actual = gqlRoom?.scores?.[2]?.content
        const expected: FindConditions<GqlContent> = {
          content_id: lessonMaterial.contentId,
          subcontent_id: subcontent1Id,
          h5p_id: lessonMaterial.h5pId,
          parent_id: lessonMaterial.h5pId,
          name: 'Default Content Name',
          type: 'H5P',
          fileType: FileType[FileType.H5P],
        }
        expect(actual).to.deep.equal(expected)
      })

      it('returns expected room.scores[0].score', () => {
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

      it('returns expected room.scores[1].score', () => {
        const actual = gqlRoom?.scores?.[1]?.score
        const expected: FindConditions<GqlScoreSummary> = {
          max: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          min: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          mean: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          median: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          medians: [xapiRecord1.xapi?.data?.statement?.result?.score?.raw],
          scoreFrequency: 1,
          scores: [xapiRecord1.xapi?.data?.statement?.result?.score?.raw],
          sum: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns expected room.scores[2].score', () => {
        const actual = gqlRoom?.scores?.[2]?.score
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

      it('returns room.scores[0].score.answers with length of 0', () => {
        const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(0)
      })

      it('returns room.scores[1].score.answers with length of 1', () => {
        const gqlAnswers = gqlRoom?.scores?.[1]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(1)
      })

      it('returns room.scores[2].score.answers with length of 0', () => {
        const gqlAnswers = gqlRoom?.scores?.[2]?.score?.answers
        expect(gqlAnswers).to.have.lengthOf(0)
      })

      it('returns expected room.scores[1].score.answers', () => {
        const actual = gqlRoom?.scores?.[1]?.score?.answers
        const expected: FindConditions<GqlAnswer>[] = [
          {
            answer: null,
            date: xapiRecord1.xapi?.clientTimestamp,
            maximumPossibleScore:
              xapiRecord1.xapi?.data?.statement?.result?.score?.max,
            minimumPossibleScore:
              xapiRecord1.xapi?.data?.statement?.result?.score?.min,
            score: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          },
        ]
        expect(actual).to.deep.equal(expected)
      })

      it('returns room.teacherComments with length of 0', () => {
        const gqlComments = gqlRoom?.teacherComments
        expect(gqlComments).to.have.lengthOf(0)
      })

      it('returns room.teacherCommentsByStudent with length of 0', () => {
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
          attendanceCount: 2,
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
          contentName: null, // TODO: Will change after FieldResolver is added.
          contentType: null, // TODO: Will change after FieldResolver is added.
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
          contentName: null,
          contentType: null,
          seen: false,
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
          contentName: xapiContentName,
          contentType: xapiContentType,
          seen: true,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 1 Answer entry', async () => {
        const count = await answerRepo().count()
        expect(count).to.equal(1)
      })
    },
  )
})
