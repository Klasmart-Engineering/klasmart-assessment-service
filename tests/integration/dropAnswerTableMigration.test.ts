import { expect } from 'chai'
import { DropAnswerTable1625183413268 } from '../../src/migrations/DropAnswerTable1625183413268'
import { Connection } from 'typeorm'
import { createAssessmentDbConnection } from '../utils/testConnection'
import {
  AnswerBuilder,
  RoomBuilder,
  UserContentScoreBuilder,
} from '../builders'

describe('dropAnswerTableMigration', () => {
  let connection: Connection

  context('assessment_xapi_answer exists and has 1 entry', () => {
    it('assessment_xapi_answer table no longer exists', async () => {
      connection = await createAssessmentDbConnection()
      const sut = new DropAnswerTable1625183413268()

      const room = await new RoomBuilder().buildAndPersist()
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(room.roomId)
        .buildAndPersist()
      await new AnswerBuilder(userContentScore).buildAndPersist()

      // Before
      let queryResult = await connection.query(
        "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE tablename = 'assessment_xapi_answer'",
      )
      expect(Number(queryResult[0].count)).to.equal(1)

      // Migrate
      await sut.up(connection.createQueryRunner())
      queryResult = await connection.query(
        "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'assessment_xapi_answer'",
      )
      expect(Number(queryResult[0].count)).to.equal(0)

      // Revert
      // Doesn't actually do anything. Just make sure it executes without throwing.
      await sut.down(connection.createQueryRunner())
      queryResult = await connection.query(
        "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'assessment_xapi_answer'",
      )
      expect(Number(queryResult[0].count)).to.equal(0)
    })

    after(async () => await connection?.close())
  })
})
