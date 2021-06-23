import expect from '../utils/chaiAsPromisedSetup'
import * as gql from 'gql-query-builder'
import { gqlTryQuery } from '../utils/gqlTry'
import EndUserBuilder from '../builders/endUserBuilder'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import { TestTitle } from '../utils/testTitles'
import ScheduleBuilder from '../builders/scheduleBuilder'
import AttendanceBuilder from '../builders/attendanceBuilder'
import UserBuilder from '../builders/userBuilder'
import XAPIRecordBuilder from '../builders/xapiRecordBuilder'
import LessonMaterialBuilder from '../builders/lessonMaterialBuilder'
import { Permission } from '../../src/auth/permissions'
import { Room } from '../../src/db/assessments/entities/room'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { XAPIRepository } from '../../src/db/xapi/repo'
import { UserPermissionChecker } from '../../src/auth/userPermissionChecker'
import { XAPIRecord } from '../../src/db/xapi/repo'
import { Container as MutableContainer } from 'typedi'
import '../utils/globalIntegrationTestHooks'
import { testClient } from '../utils/globalIntegrationTestHooks'

describe('roomResolver.Room', () => {
  context(TestTitle.Authentication.context, () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      const roomId = 'room1'

      const endUser = await new EndUserBuilder()
        .dontAuthenticate()
        .buildAndPersist()

      const query = gql.query({
        operation: 'Room',
        variables: { room_id: roomId },
        fields: ['room_id'],
      })

      // Act
      const fn = () =>
        gqlTryQuery(testClient, query, { authorization: endUser.token }, false)

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
    })
  })

  // context(TestTitle.ScheduleNotFound.context, () => {
  //   it(TestTitle.ScheduleNotFound.throwsError, async () => {
  //     // Arrange
  //     const roomId = 'room1'

  //     const endUser = await new EndUserBuilder()
  //       .authenticate()
  //       .buildAndPersist()

  //     const query = gql.query({
  //       operation: 'Room',
  //       variables: { room_id: roomId },
  //       fields: ['room_id'],
  //     })

  //     // Act
  //     const fn = () =>
  //       gqlTryQuery(testClient, query, { authorization: endUser.token }, false)

  //     // Assert
  //     await expect(fn()).to.be.rejectedWith(
  //       ErrorMessage.scheduleNotFound(roomId),
  //     )
  //   })
  // })

  // context(
  //   TestTitle.NoPermission.context(Permission.assessments_page_406),
  //   () => {
  //     it(TestTitle.NoPermission.throwsError, async () => {
  //       // Arrange
  //       const roomId = 'room1'

  //       const permissionChecker = Substitute.for<UserPermissionChecker>()
  //       MutableContainer.set(UserPermissionChecker, permissionChecker)

  //       const endUser = await new EndUserBuilder()
  //         .authenticate()
  //         .buildAndPersist()
  //       const student = await new UserBuilder().buildAndPersist()
  //       const schedule = await new ScheduleBuilder()
  //         .withRoomId(roomId)
  //         .buildAndPersist()
  //       const endUserAttendance = await new AttendanceBuilder()
  //         .withroomId(roomId)
  //         .withUserId(endUser.userId)
  //         .buildAndPersist()
  //       const studentAttendance = await new AttendanceBuilder()
  //         .withroomId(roomId)
  //         .withUserId(student.userId)
  //         .buildAndPersist()
  //       permissionChecker.hasPermission(Arg.any()).resolves(false)

  //       const query = gql.query({
  //         operation: 'Room',
  //         variables: { room_id: roomId },
  //         fields: ['room_id'],
  //       })

  //       // Act
  //       const fn = () =>
  //         gqlTryQuery(
  //           testClient,
  //           query,
  //           { authorization: endUser.token },
  //           false,
  //         )

  //       // Assert
  //       await expect(fn()).to.be.rejectedWith(
  //         ErrorMessage.permission(
  //           endUser.userId,
  //           Permission.assessments_page_406,
  //         ),
  //       )
  //     })
  //   },
  // )

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

      const query = gql.query({
        operation: 'Room',
        variables: { room_id: roomId },
        fields: ['room_id'],
      })

      // Act
      const gqlRoom = (
        await gqlTryQuery(testClient, query, { authorization: endUser.token })
      )?.Room

      // Assert
      expect(gqlRoom).to.not.be.undefined
      expect(gqlRoom['room_id']).to.equal(roomId)
    })
  })
})
