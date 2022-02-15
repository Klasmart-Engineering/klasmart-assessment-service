import { expect } from 'chai'
import { v4 } from 'uuid'
import { XApiSqlRecordBuilder } from '../builders'
import { XApiRecord } from '../../src/db/xapi'
import { XApiSqlRepository } from '../../src/db/xapi/sql/repo'
import { createXApiDbConnection } from '../utils/testConnection'
import { Connection } from 'typeorm'
import { XApiRecordSql } from '../../src/db/xapi/sql/entities'

describe.only('xApi SQL database interface', () => {
  context('1 student, 1 xapi "score" event', () => {
    let dbConnection: Connection
    let xapiRecord: XApiRecordSql
    let xapiRecords: ReadonlyArray<XApiRecord>
    const xapiContentName = 'My H5P Name'
    const xapiContentType = 'Flashcards'
    const score = { min: 0, max: 2, raw: 1 }
    const studentId = v4()
    const lessonMaterialH5pId = v4()

    before(async () => {
      // Arrange
      dbConnection = await createXApiDbConnection()
      xapiRecord = await new XApiSqlRecordBuilder()
        .withUserId(studentId)
        .withH5pId(lessonMaterialH5pId)
        .withH5pName(xapiContentName)
        .withH5pType(xapiContentType)
        .withScore(score)
        .withResponse(undefined)
        .buildAndPersist()

      const typeOrmRepository = dbConnection.getRepository(XApiRecordSql)
      const sut = new XApiSqlRepository(typeOrmRepository)
      xapiRecords = await sut.groupSearchXApiEventsForUsers([studentId])
    })

    after(async () => await dbConnection?.close())

    it('returns xapiRecords with length of 1', async () => {
      expect(xapiRecords).to.not.be.null
      expect(xapiRecords).to.not.be.undefined
      expect(xapiRecords).to.have.lengthOf(1)
    })

    it('returns expected xapiRecord.userId', async () => {
      const actual = xapiRecords?.[0]?.userId
      expect(actual).to.deep.equal(studentId)
    })
  })

  // query by room -> for 2 users create 3 rooms and check that events belong to the right room
  // query by group of userIds -> for 2 users create events with and without a roomId but with timestamps that coincide in time
  //
  //
  //
  //
  //
})
