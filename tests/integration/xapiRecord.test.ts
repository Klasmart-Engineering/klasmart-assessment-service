import { expect } from 'chai'
import { v4 } from 'uuid'
import { XApiSqlRecordBuilder } from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { XApiRecord } from '../../src/db/xapi'
import { XApiSqlRepository } from '../../src/db/xapi/sql/repo'
import { Container } from 'typeorm-typedi-extensions'
import { createXApiDbConnection } from '../utils/testConnection'
import { Connection } from 'typeorm'
import { XApiRecordSql } from '../../src/db/xapi/sql/entities'

describe('xApi SQL database interface', () => {
  context('1 student, 1 xapi "score" event', () => {
    let dbConnection: Connection
    let xapiRecord: XApiRecord
    let xapiRecords: XApiRecord[]
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
      xapiRecords = await sut.searchXApiEvents(studentId)
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
})
