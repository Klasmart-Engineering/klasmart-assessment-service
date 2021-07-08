import expect from '../utils/chaiAsPromisedSetup'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import { TestTitle } from '../utils/testTitles'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { XAPIRepository } from '../../src/db/xapi/repo'
import { XAPIRecord } from '../../src/db/xapi/repo'
import { Container as MutableContainer } from 'typedi'
import '../utils/globalIntegrationTestHooks'
import EndUser from '../entities/endUser'
import { User } from '../../src/db/users/entities'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { FindConditions, getRepository } from 'typeorm'
import { Content } from '../../src/db/cms/entities/content'
import { FileType } from '../../src/db/cms/enums/fileType'
import {
  GqlUser,
  GqlContent,
  GqlScoreSummary,
  GqlAnswer,
  GqlTeacherScore,
  GqlTeacherComment,
} from '../queriesAndMutations/gqlInterfaces'
import { GqlRoom, roomQuery } from '../queriesAndMutations/roomOps'
import {
  AttendanceBuilder,
  EndUserBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  RoomBuilder,
  ScheduleBuilder,
  TeacherScoreBuilder,
  UserBuilder,
  UserContentScoreBuilder,
  XAPIRecordBuilder,
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

/**
 * TODO:
 * - *scores 0 the first time
 * - *room/ucs/answer exist (update), make sure teacher scores and comments don't get wiped out
 * - *multiple-hotspot scoring
 * - *non-h5p materials
 * - specify expected xapi timestamps
 * - *user content score ordering
 * - *include user content scores for students with no events
 * - *multiple students
 * - *multiple contents
 * - *xapi event not part of lesson plan
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
      const roomId = 'room1'

      const endUser = await new EndUserBuilder()
        .dontAuthenticate()
        .buildAndPersist()

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
      await dbDisconnect()
    })
  })

  context(TestTitle.ScheduleNotFound.context, () => {
    it(TestTitle.ScheduleNotFound.throwsError, async () => {
      // Arrange
      await dbConnect()
      const roomId = 'room1'

      const endUser = await new EndUserBuilder()
        .authenticate()
        .buildAndPersist()

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.scheduleNotFound(roomId),
      )
      await dbDisconnect()
    })
  })

  context('1 student, 1 xapi event', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XAPIRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()
      const xapiRepository = Substitute.for<XAPIRepository>()
      MutableContainer.set(XAPIRepository, xapiRepository)

      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const endUserAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .buildAndPersist()
      const studentAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .buildAndPersist()
      lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      xapiRecord = new XAPIRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .build()
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student.userId, Arg.any(), Arg.any())
        .returns(
          Promise.resolve<XAPIRecord[]>([xapiRecord]),
        )

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
        name: xapiContentName,
        type: xapiContentType,
        fileType: FileType[FileType.H5P],
      }
      expect(gqlContent).to.deep.equal(expectedContent)
    })

    it('returns expected room.scores[0].score', async () => {
      const gqlScore = gqlRoom?.scores?.[0]?.score
      const expectedScore: FindConditions<GqlScoreSummary> = {
        max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
        min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
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
          answer: xapiRecord.xapi?.data?.statement?.result?.response,
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
        recalculate: false,
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
        max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
        min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
        sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        scoreFrequency: 1,
        seen: true,
      }

      expect(dbUserContentScore).to.deep.include(expected)
    })

    it('DB: adds 0 Answer entries', async () => {
      const dbAnswers = await answerRepo().find()
      expect(dbAnswers).to.have.lengthOf(0)
    })
  })

  context(
    '1 student, 1 xapi event, 3 overlapping attendance sessions with same id',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial: Content
      let xapiRecord: XAPIRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const xapiRepository = Substitute.for<XAPIRepository>()
        MutableContainer.set(XAPIRepository, xapiRepository)

        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const endUserAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .buildAndPersist()
        const studentAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .withPeriod(new Date(), new Date(Date.now() + 5 * 60000))
          .buildAndPersist()
        const studentAttendance2 = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .withSessionId(studentAttendance.sessionId)
          .withPeriod(
            new Date(Date.now() + 2.5 * 60000),
            new Date(Date.now() + 7.5 * 60000),
          )
          .buildAndPersist()
        const studentAttendance3 = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .withSessionId(studentAttendance.sessionId)
          .withPeriod(
            new Date(Date.now() - 2.5 * 60000),
            new Date(Date.now() + 2 * 60000),
          )
          .buildAndPersist()
        lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        xapiRecord = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .build()
        xapiRepository
          .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>([]))
        xapiRepository
          .searchXApiEvents(student.userId, Arg.any(), Arg.any())
          .returns(
            Promise.resolve<XAPIRecord[]>([xapiRecord]),
          )

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
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
        const expectedScore: FindConditions<GqlScoreSummary> = {
          max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
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
            answer: xapiRecord.xapi?.data?.statement?.result?.response,
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
          recalculate: false,
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
          max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
          sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
          scoreFrequency: 1,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 0 Answer entries', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(0)
      })

      // TODO: Add back 'DB: Answer has expected values' test once caching is enabled.
    },
  )

  context(
    '1 student, 1 xapi event for 2nd material, 1 xapi event for 1st material (in that order)',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial1: Content
      let lessonMaterial2: Content
      let xapiRecord1: XAPIRecord
      let xapiRecord2: XAPIRecord
      const xapiContent1Name = 'Material 1'
      const xapiContent1Type = 'Flashcards'
      const xapiContent2Name = 'Material 2'
      const xapiContent2Type = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const xapiRepository = Substitute.for<XAPIRepository>()
        MutableContainer.set(XAPIRepository, xapiRepository)

        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const endUserAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .buildAndPersist()
        const studentAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .buildAndPersist()
        lessonMaterial1 = await new LessonMaterialBuilder()
          .withName(xapiContent1Name)
          .buildAndPersist()
        lessonMaterial2 = await new LessonMaterialBuilder()
          .withName(xapiContent2Name)
          .buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial1.contentId)
          .addMaterialId(lessonMaterial2.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        xapiRecord1 = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial1.h5pId)
          .withH5pName(xapiContent1Name)
          .withH5pType(xapiContent1Type)
          .withScore({ min: 0, max: 10, raw: 5 })
          .build()
        xapiRecord2 = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial2.h5pId)
          .withH5pName(xapiContent2Name)
          .withH5pType(xapiContent2Type)
          .withScore({ min: 0, max: 15, raw: 15 })
          .build()
        xapiRepository
          .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>([]))
        xapiRepository
          .searchXApiEvents(student.userId, Arg.any(), Arg.any())
          .returns(
            Promise.resolve<XAPIRecord[]>([xapiRecord2, xapiRecord1]),
          )

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
            answer: xapiRecord1.xapi?.data?.statement?.result?.response,
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
            answer: xapiRecord2.xapi?.data?.statement?.result?.response,
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
          recalculate: false,
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
          max: xapiRecord1.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord1.xapi?.data?.statement?.result?.score?.min,
          sum: xapiRecord1.xapi?.data?.statement?.result?.score?.raw,
          scoreFrequency: 1,
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
          max: xapiRecord2.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord2.xapi?.data?.statement?.result?.score?.min,
          sum: xapiRecord2.xapi?.data?.statement?.result?.score?.raw,
          scoreFrequency: 1,
          seen: true,
        }

        expect(actual).to.deep.include(expected)
      })

      it('DB: adds 0 Answer entries', async () => {
        const count = await answerRepo().count()
        expect(count).to.equal(0)
      })

      // TODO: Add back 'DB: Answer has expected values' test once caching is enabled.
    },
  )

  context('1 student, 2 xapi events', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XAPIRecord
    let xapiRecord2: XAPIRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()
      const xapiRepository = Substitute.for<XAPIRepository>()
      MutableContainer.set(XAPIRepository, xapiRepository)

      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const endUserAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .buildAndPersist()
      const studentAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .buildAndPersist()
      lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      xapiRecord = new XAPIRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore({ raw: 0, min: 0, max: 3 })
        .build()
      xapiRecord2 = new XAPIRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withServerTimestamp(xapiRecord.serverTimestamp! + 1000)
        .withClientTimestamp(xapiRecord.xapi?.clientTimestamp! + 1000)
        .withScore({ raw: 2, min: 0, max: 3 })
        .build()
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student.userId, Arg.any(), Arg.any())
        .returns(
          Promise.resolve<XAPIRecord[]>([xapiRecord, xapiRecord2]),
        )
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
      const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers!
      const answer1 = gqlAnswers[0].score
      const answer2 = gqlAnswers[1].score
      const expectedAnswer1 = 0
      const expectedAnswer2 = 2
      expect(answer1).to.equal(expectedAnswer1)
      expect(answer2).to.equal(expectedAnswer2)
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
        recalculate: false,
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
        max: 3,
        min: 0,
        sum: 2,
        scoreFrequency: 2,
        seen: true,
      }

      expect(dbUserContentScore).to.deep.include(expected)
    })

    it('DB: adds 0 Answer entries', async () => {
      const answerCount = await answerRepo().count()
      expect(answerCount).to.equal(0)
    })
  })

  context(
    '1 student, 1 xapi event which is not part of the lesson plan',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: GqlRoom | undefined | null
      let student: User
      let lessonMaterial1: Content
      let lessonMaterial2: Content
      let xapiRecord: XAPIRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const xapiRepository = Substitute.for<XAPIRepository>()
        MutableContainer.set(XAPIRepository, xapiRepository)

        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const endUserAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .buildAndPersist()
        const studentAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .buildAndPersist()
        lessonMaterial1 = await new LessonMaterialBuilder().buildAndPersist()
        lessonMaterial2 = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial2.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        xapiRecord = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial1.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .build()
        xapiRepository
          .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>([]))
        xapiRepository
          .searchXApiEvents(student.userId, Arg.any(), Arg.any())
          .returns(
            Promise.resolve<XAPIRecord[]>([xapiRecord]),
          )

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
          recalculate: false,
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
          max: null,
          min: null,
          sum: 0,
          scoreFrequency: 0,
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

  context('student1 0 xapi events; student2 1 xapi event', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: GqlRoom | undefined | null
    let student1: User
    let student2: User
    let lessonMaterial: Content
    let xapiRecord: XAPIRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()
      const xapiRepository = Substitute.for<XAPIRepository>()
      MutableContainer.set(XAPIRepository, xapiRepository)

      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student1 = await new UserBuilder().buildAndPersist()
      student2 = await new UserBuilder().buildAndPersist()
      const endUserAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .buildAndPersist()
      const student1Attendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student1.userId)
        .buildAndPersist()
      const student2Attendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student2.userId)
        .buildAndPersist()
      lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      xapiRecord = new XAPIRecordBuilder()
        .withUserId(student2.userId)
        .withH5pId(lessonMaterial.h5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .build()
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student1.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student2.userId, Arg.any(), Arg.any())
        .returns(
          Promise.resolve<XAPIRecord[]>([xapiRecord]),
        )

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
        max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
        min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
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
          answer: xapiRecord.xapi?.data?.statement?.result?.response,
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
        recalculate: false,
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
        max: null,
        min: null,
        sum: 0,
        scoreFrequency: 0,
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
        max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
        min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
        sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
        scoreFrequency: 1,
        seen: true,
      }

      expect(actual).to.deep.include(expected)
    })

    it('DB: adds 0 Answer entries', async () => {
      const dbAnswers = await answerRepo().find()
      expect(dbAnswers).to.have.lengthOf(0)
    })

    // TODO: Add back 'DB: Answer has expected values' test once caching is enabled.
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
      const xapiRepository = Substitute.for<XAPIRepository>()
      MutableContainer.set(XAPIRepository, xapiRepository)

      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const endUserAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .buildAndPersist()
      const studentAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .buildAndPersist()
      lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))

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
        recalculate: false,
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
        max: null,
        min: null,
        sum: 0,
        scoreFrequency: 0,
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
      const xapiRepository = Substitute.for<XAPIRepository>()
      MutableContainer.set(XAPIRepository, xapiRepository)

      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const endUserAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .buildAndPersist()
      const studentAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .buildAndPersist()
      lessonMaterial = await new LessonMaterialBuilder()
        .withSource(FileType.Audio)
        .buildAndPersist()
      const lessonPlan = await new LessonPlanBuilder()
        .addMaterialId(lessonMaterial.contentId)
        .buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .buildAndPersist()
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))

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
        recalculate: false,
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
        max: null,
        min: null,
        sum: 0,
        scoreFrequency: 0,
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
      let xapiRecord: XAPIRecord
      let teacherScore: TeacherScore
      let teacherComment: TeacherComment
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const xapiRepository = Substitute.for<XAPIRepository>()
        MutableContainer.set(XAPIRepository, xapiRepository)

        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const endUserAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .buildAndPersist()
        const studentAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .buildAndPersist()
        lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        xapiRecord = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .build()
        xapiRepository
          .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>([]))
        xapiRepository
          .searchXApiEvents(student.userId, Arg.any(), Arg.any())
          .returns(
            Promise.resolve<XAPIRecord[]>([xapiRecord]),
          )
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
          // Skip checking student, and teacher for now. Not the focus of this test.
        }
        expect(actual).to.deep.include(expected)
      })

      it('returns room.scores with length of 1', async () => {
        const gqlScores = gqlRoom?.scores
        expect(gqlScores).to.have.lengthOf(1)
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
          // Skip checking content, student, and teacher for now. Not the focus of this test.
        }
        expect(actual).to.deep.include(expected)
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
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
        const expectedScore: FindConditions<GqlScoreSummary> = {
          max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
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
            answer: xapiRecord.xapi?.data?.statement?.result?.response,
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
          recalculate: false,
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
          max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
          sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
          scoreFrequency: 1,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 0 Answer entries', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(0)
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
      let xapiRecords: XAPIRecord[]
      const xapiContentName = 'My Multiple Hotspots'
      const xapiContentType = 'ImageMultipleHotspotQuestion'

      before(async () => {
        // Arrange
        await dbConnect()
        const xapiRepository = Substitute.for<XAPIRepository>()
        MutableContainer.set(XAPIRepository, xapiRepository)

        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const endUserAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .buildAndPersist()
        const studentAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .buildAndPersist()
        lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        const xapiRecordBuilder = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .withResponse(undefined)
        xapiRecords = [
          xapiRecordBuilder.withVerb('attempted').withScore(undefined).build(),
          xapiRecordBuilder
            .withVerb('answered')
            .withScore({ min: 0, max: 3, raw: 1 })
            .build(),
          xapiRecordBuilder
            .withVerb('answered')
            .withScore({ min: 0, max: 3, raw: 2 })
            .build(),
          xapiRecordBuilder.withVerb('attempted').withScore(undefined).build(),
          xapiRecordBuilder
            .withVerb('answered')
            .withScore({ min: 0, max: 3, raw: 0 })
            .build(),
        ]
        xapiRepository
          .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>([]))
        xapiRepository
          .searchXApiEvents(student.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>(xapiRecords))

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
            date: xapiRecords[0].xapi?.clientTimestamp,
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
          recalculate: false,
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
          max: 3,
          min: 0,
          sum: 2,
          scoreFrequency: 2,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 0 Answer entries', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(0)
      })

      // TODO: Add back 'DB: Answer has expected values' test once caching is enabled.
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
      let xapiRecord: XAPIRecord
      const xapiContentName = 'My H5P Name'
      const xapiContentType = 'Flashcards'

      before(async () => {
        // Arrange
        await dbConnect()
        const xapiRepository = Substitute.for<XAPIRepository>()
        MutableContainer.set(XAPIRepository, xapiRepository)

        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const endUserAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(endUser.userId)
          .buildAndPersist()
        const studentAttendance = await new AttendanceBuilder()
          .withroomId(roomId)
          .withUserId(student.userId)
          .buildAndPersist()
        lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder()
          .addMaterialId(lessonMaterial.contentId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .withLessonPlanId(lessonPlan.contentId)
          .buildAndPersist()
        xapiRecord = new XAPIRecordBuilder()
          .withUserId(student.userId)
          .withH5pId(lessonMaterial.h5pId)
          .withH5pName(xapiContentName)
          .withH5pType(xapiContentType)
          .build()
        xapiRepository
          .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
          .returns(Promise.resolve<XAPIRecord[]>([]))
        xapiRepository
          .searchXApiEvents(student.userId, Arg.any(), Arg.any())
          .returns(
            Promise.resolve<XAPIRecord[]>([xapiRecord]),
          )
        const userContentScore = await new UserContentScoreBuilder()
          .withroomId(roomId)
          .withStudentId(student.userId)
          .withContentKey(lessonMaterial.h5pId!) // using h5pId instead of contentId
          .withContentType(xapiContentType)
          .withContentName(xapiContentName)
          .buildAndPersist()

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
          name: xapiContentName,
          type: xapiContentType,
          fileType: FileType[FileType.H5P],
        }
        expect(gqlContent).to.deep.equal(expectedContent)
      })

      it('returns expected room.scores[0].score', async () => {
        const gqlScore = gqlRoom?.scores?.[0]?.score
        const expectedScore: FindConditions<GqlScoreSummary> = {
          max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
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
            answer: xapiRecord.xapi?.data?.statement?.result?.response,
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
          recalculate: false,
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
          max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
          min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
          sum: xapiRecord.xapi?.data?.statement?.result?.score?.raw,
          scoreFrequency: 1,
          seen: true,
        }

        expect(dbUserContentScore).to.deep.include(expected)
      })

      it('DB: adds 0 Answer entries', async () => {
        const dbAnswers = await answerRepo().find()
        expect(dbAnswers).to.have.lengthOf(0)
      })

      // TODO: Add back 'DB: Answer has expected values' test once caching is enabled.
    },
  )
})
