import expect from '../utils/chaiAsPromisedSetup'
import * as gql from 'gql-query-builder'
import { gqlTryQuery } from '../utils/gqlTry'
import EndUserBuilder from '../builders/endUserBuilder'
import { testClient } from '../utils/globalIntegrationTestHooks'
import { ErrorMessage } from '../../src/errorMessages'
import { TestTitle } from '../utils/testTitles'

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

  context(TestTitle.ScheduleNotFound.context, () => {
    it(TestTitle.ScheduleNotFound.throwsError, async () => {
      // Arrange
      const roomId = 'room1'

      const endUser = await new EndUserBuilder()
        .authenticate()
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
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.scheduleNotFound(roomId),
      )
    })
  })
})
