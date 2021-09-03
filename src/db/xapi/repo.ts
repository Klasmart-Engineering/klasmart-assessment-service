import { Service } from 'typedi'
import { XApiDynamodbRepository } from './dynamodb/repo'
import { XApiSqlRepository } from './sql/repo'
import { XApiRecord } from './interfaces'

@Service()
export class XApiRepository {
  constructor(
    private xapiDynamodbRepo: XApiDynamodbRepository,
    private xapiSqlRepo: XApiSqlRepository,
  ) {}

  async searchXApiEvents(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]> {
    if (process.env.USE_XAPI_SQL_DATABASE_FLAG === '1') {
      console.log('XApiRepository uses Postgres database for storage')
      return await this.xapiSqlRepo.searchXApiEvents(userId, from, to)
    } else {
      console.log('XApiRepository uses DynamoDb for storage')
      return await this.xapiDynamodbRepo.searchXApiEvents(userId, from, to)
    }
  }
}
