import { getRepository } from 'typeorm'
import XApiRecordBuilder from './xapiRecordBuilder'
import { XApiRecordSql } from '../../src/db/xapi/sql/entities'
import { XAPI_CONNECTION_NAME } from '../../src/db/xapi/sql/connectToXApiDatabase'

export class XApiSqlRecordBuilder extends XApiRecordBuilder {
  public constructor() {
    super()
  }

  public async buildAndPersist(): Promise<XApiRecordSql> {
    const entity = this.build()
    return await getRepository(XApiRecordSql, XAPI_CONNECTION_NAME).save(entity)
  }
}
