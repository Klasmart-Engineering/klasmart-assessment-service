import expect from '../utils/chaiAsPromisedSetup'
import * as gql from 'gql-query-builder'
import { gqlTryQuery } from '../utils/gqlTry'
import EndUserBuilder from '../builders/endUserBuilder'
import { testClient } from '../utils/globalIntegrationTestHooks'
import { ErrorMessage } from '../../src/errorMessages'

describe('roomResolver', () => {
  context('queried room exists in database', () => {
    it('returns room with calculated scores', async () => {
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

    it('test 2', async () => {
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
