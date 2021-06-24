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
import { roomQuery } from '../queriesAndMutations/roomOps'

describe('roomResolver.Room', () => {
  context(TestTitle.Authentication.context, () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      const roomId = 'room1'

      const endUser = await new EndUserBuilder()
        .dontAuthenticate()
        .buildAndPersist()

      // Act
      const fn = () => roomQuery(roomId, endUser, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
    })
  })

  context(TestTitle.ScheduleNotFound.context, () => {
    it(TestTitle.ScheduleNotFound.throwsError, async () => {
      // Arrange
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
    })
  })

  context('1 student, 1 xapi event', () => {
    it('gql returns room with matching id', async () => {
      // Arrange
      const roomId = 'room1'
      const xapiRepository = Substitute.for<XAPIRepository>()
      const permissionChecker = Substitute.for<UserPermissionChecker>()
      MutableContainer.set(UserPermissionChecker, permissionChecker)
      MutableContainer.set(XAPIRepository, xapiRepository)

      const endUser = await new EndUserBuilder()
        .authenticate()
        .buildAndPersist()
      const student = await new UserBuilder().buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .buildAndPersist()
      const endUserAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(endUser.userId)
        .buildAndPersist()
      const studentAttendance = await new AttendanceBuilder()
        .withroomId(roomId)
        .withUserId(student.userId)
        .buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      const xapiRecord = new XAPIRecordBuilder()
        .withUserId(student.userId)
        .withH5pId(lessonMaterial.h5pId)
        .build()
      permissionChecker.hasPermission(Arg.any()).resolves(true)
      xapiRepository
        .searchXApiEvents(endUser.userId, Arg.any(), Arg.any())
        .returns(Promise.resolve<XAPIRecord[]>([]))
      xapiRepository
        .searchXApiEvents(student.userId, Arg.any(), Arg.any())
        .returns(
          Promise.resolve<XAPIRecord[]>([xapiRecord]),
        )

      // Act
      const gqlRoom = await roomQuery(roomId, endUser)

      // Assert
      expect(gqlRoom).to.not.be.undefined
      expect(gqlRoom['room_id']).to.equal(roomId)
    })
  })
})
