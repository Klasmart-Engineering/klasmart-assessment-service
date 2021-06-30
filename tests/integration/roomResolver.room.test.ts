import expect from '../utils/chaiAsPromisedSetup'
import EndUserBuilder from '../builders/endUserBuilder'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import { TestTitle } from '../utils/testTitles'
import ScheduleBuilder from '../builders/scheduleBuilder'
import AttendanceBuilder from '../builders/attendanceBuilder'
import UserBuilder from '../builders/userBuilder'
import XAPIRecordBuilder from '../builders/xapiRecordBuilder'
import LessonMaterialBuilder from '../builders/lessonMaterialBuilder'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { XAPIRepository } from '../../src/db/xapi/repo'
import { UserPermissionChecker } from '../../src/auth/userPermissionChecker'
import { XAPIRecord } from '../../src/db/xapi/repo'
import { Container as MutableContainer } from 'typedi'
import '../utils/globalIntegrationTestHooks'
import EndUser from '../entities/endUser'
import { User } from '../../src/db/users/entities'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import LessonPlanBuilder from '../builders/lessonPlanBuilder'
import { FindConditions } from 'typeorm'
import { Content } from '../../src/db/cms/entities/content'
import { FileType } from '../../src/db/cms/enums/fileType'
import {
  GqlUser,
  GqlContent,
  GqlScoreSummary,
  GqlAnswer,
} from '../queriesAndMutations/gqlInterfaces'
import { RoomQuery, roomQuery } from '../queriesAndMutations/roomOps'

describe('roomResolver.Room', () => {
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
  })

  // context('1 student, 2 xapi events', () => {
  //   const roomId = 'room1'
  //   let endUser: EndUser
  //   let gqlRoom: RoomQuery | undefined | null
  //   let student: User
  //   let lessonMaterial: Content
  //   let xapiRecord: XAPIRecord
  //   let xapiRecord2: XAPIRecord

  //   before(async () => {
  //     // Arrange
  //     await dbConnect()
  //     const xapiRepository = Substitute.for<XAPIRepository>()
  //     MutableContainer.set(XAPIRepository, xapiRepository)

  //     endUser = await new EndUserBuilder().authenticate().buildAndPersist()
  //     student = await new UserBuilder().buildAndPersist()
  //     const endUserAttendance = await new AttendanceBuilder()
  //       .withroomId(roomId)
  //       .withUserId(endUser.userId)
  //       .buildAndPersist()
  //     const studentAttendance = await new AttendanceBuilder()
  //       .withroomId(roomId)
  //       .withUserId(student.userId)
  //       .buildAndPersist()
  //     lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
  //     const lessonPlan = await new LessonPlanBuilder()
  //       .addMaterialId(lessonMaterial.contentId)
  //       .buildAndPersist()
  //     const schedule = await new ScheduleBuilder()
  //       .withRoomId(roomId)
  //       .withLessonPlanId(lessonPlan.contentId)
  //       .buildAndPersist()
  //     xapiRecord = new XAPIRecordBuilder()
  //       .withUserId(student.userId)
  //       .withH5pId(lessonMaterial.h5pId)
  //       .withScore({ raw: 0, min: 0, max: 3 })
  //       .build()
  //     xapiRecord2 = new XAPIRecordBuilder()
  //       .withUserId(student.userId)
  //       .withH5pId(lessonMaterial.h5pId)
  //       .withServerTimestamp(xapiRecord.serverTimestamp! + 1)
  //       .withClientTimestamp(xapiRecord.xapi?.clientTimestamp! + 1)
  //       .withScore({ raw: 2, min: 0, max: 3 })
  //       .build()
  //     //console.log(xapiRecord.xapi?.data?.statement?.verb?.display?.['en-US'])
  //     xapiRepository
  //       .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
  //       .returns(Promise.resolve<XAPIRecord[]>([]))
  //     xapiRepository
  //       .searchXApiEvents(student.userId, Arg.any(), Arg.any())
  //       .returns(
  //         Promise.resolve<XAPIRecord[]>([xapiRecord, xapiRecord2]),
  //       )
  //   })

  //   after(async () => await dbDisconnect())

  //   it('returns room with expected id', async () => {
  //     // Act
  //     gqlRoom = await roomQuery(roomId, endUser)
  //     //console.log(JSON.stringify(gqlRoom, null, 2))

  //     // Assert
  //     expect(gqlRoom).to.not.be.undefined
  //     expect(gqlRoom?.room_id).to.equal(roomId)
  //   })

  //   it('returns room.scores with length of 1', async () => {
  //     const gqlScores = gqlRoom?.scores
  //     expect(gqlScores).to.have.lengthOf(1)
  //   })

  //   it('returns room.scores[0].teacherScores with length of 0', async () => {
  //     const gqlTeacherScores = gqlRoom?.scores?.[0].teacherScores
  //     expect(gqlTeacherScores).to.have.lengthOf(0)
  //   })

  //   it('returns expected room.scores[0].user', async () => {
  //     const score = gqlRoom?.scores?.[0]
  //     const gqlStudent = score?.user
  //     const expectedStudent: FindConditions<GqlUser> = {
  //       user_id: student.userId,
  //       given_name: student.givenName,
  //       family_name: student.familyName,
  //     }
  //     expect(gqlStudent).to.deep.equal(expectedStudent)
  //   })

  //   it('returns expected room.scores[0].content', async () => {
  //     const gqlContent = gqlRoom?.scores?.[0]?.content
  //     const expectedContent: FindConditions<GqlContent> = {
  //       content_id: lessonMaterial.contentId,
  //       subcontent_id: lessonMaterial.subcontentId ?? null,
  //       h5p_id: lessonMaterial.h5pId,
  //       name: lessonMaterial.name,
  //       type: lessonMaterial.type,
  //       fileType: FileType[FileType.H5P],
  //     }
  //     expect(gqlContent).to.deep.equal(expectedContent)
  //   })

  //   it('returns expected room.scores[0].score.scores', async () => {
  //     const gqlScores = gqlRoom?.scores?.[0]?.score?.scores
  //     const expectedScore1 =
  //       xapiRecord.xapi?.data?.statement?.result?.score?.raw
  //     const expectedScore2 =
  //       xapiRecord2.xapi?.data?.statement?.result?.score?.raw
  //     expect(gqlScores).to.deep.equal([expectedScore1, expectedScore2])
  //   })

  //   it('returns room.scores[0].score.answers with length of 2', async () => {
  //     const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers
  //     expect(gqlAnswers).to.have.lengthOf(2)
  //   })

  //   it('returns expected room.scores[0].score.answers', async () => {
  //     const gqlAnswers = gqlRoom?.scores?.[0]?.score?.answers!
  //     const answer1 = gqlAnswers[0].score
  //     const answer2 = gqlAnswers[1].score
  //     const expectedAnswer1 = 0
  //     const expectedAnswer2 = 2
  //     expect(answer1).to.equal(expectedAnswer1)
  //     expect(answer2).to.equal(expectedAnswer2)
  //   })
  // })
})
