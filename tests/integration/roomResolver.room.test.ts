import expect from '../utils/chaiAsPromisedSetup'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import { TestTitle } from '../utils/testTitles'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { XAPIRepository } from '../../src/db/xapi/repo'
import { UserPermissionChecker } from '../../src/auth/userPermissionChecker'
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
} from '../queriesAndMutations/gqlInterfaces'
import { RoomQuery, roomQuery } from '../queriesAndMutations/roomOps'
import {
  AttendanceBuilder,
  EndUserBuilder,
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
  UserBuilder,
  UserContentScoreBuilder,
  XAPIRecordBuilder,
} from '../builders'
import {
  Answer,
  Room,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

/**
 * TODO:
 * - throws when wrong room id
 * - scores 0 the first time
 * - room/ucs/answer exist (update), make sure teacher scores and comments don't get wiped out
 * - multiple-hotspots scoring
 * - non-h5p materials
 */

describe('roomResolver.Room', () => {
  const roomRepo = () => getRepository(Room, ASSESSMENTS_CONNECTION_NAME)
  const userContentScoreRepo = () =>
    getRepository(UserContentScore, ASSESSMENTS_CONNECTION_NAME)
  const answerRepo = () => getRepository(Answer, ASSESSMENTS_CONNECTION_NAME)

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
    let gqlRoom: RoomQuery | undefined | null
    let student: User
    let lessonMaterial: Content
    let xapiRecord: XAPIRecord
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'

    before(async () => {
      // Arrange
      await dbConnect()
      const xapiRepository = Substitute.for<XAPIRepository>()
      const permissionChecker = Substitute.for<UserPermissionChecker>()
      MutableContainer.set(UserPermissionChecker, permissionChecker)
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
      //console.log(xapiRecord.xapi?.data?.statement?.verb?.display?.['en-US'])
      //permissionChecker.hasPermission(Arg.any()).resolves(true)
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student.userId, Arg.any(), Arg.any())
        .returns(
          Promise.resolve<XAPIRecord[]>([xapiRecord]),
        )
    })

    after(async () => await dbDisconnect())

    it('returns room with expected id', async () => {
      // Act
      gqlRoom = await roomQuery(roomId, endUser)
      //console.log(JSON.stringify(gqlRoom, null, 2))

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
        name: xapiContentName ?? lessonMaterial.name,
        type: lessonMaterial.type,
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
  })

  context('1 student, 2 xapi events', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlRoom: RoomQuery | undefined | null
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
        .withServerTimestamp(xapiRecord.serverTimestamp! + 10)
        .withClientTimestamp(xapiRecord.xapi?.clientTimestamp! + 10)
        .withScore({ raw: 2, min: 0, max: 3 })
        .build()
      //console.log(xapiRecord.xapi?.data?.statement?.verb?.display?.['en-US'])
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
        max: xapiRecord.xapi?.data?.statement?.result?.score?.max,
        min: xapiRecord.xapi?.data?.statement?.result?.score?.min,
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

    // TODO: Add back 'DB: Answers has expected values' test once caching is enabled.
  })

  context(
    '[PRE CONTENT_ID MIGRATION] stored UserContentScore is using the h5pId',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlRoom: RoomQuery | undefined | null
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
          subcontent_id: lessonMaterial.subcontentId ?? null,
          h5p_id: lessonMaterial.h5pId,
          name: xapiContentName ?? lessonMaterial.name,
          type: lessonMaterial.type,
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
