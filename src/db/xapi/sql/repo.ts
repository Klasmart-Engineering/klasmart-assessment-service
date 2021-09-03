import {
  Repository,
  Between,
  Equal,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Service } from 'typedi'
import { XApiRecordSql } from './entities'
import { XApiRecord } from '../interfaces'
import { XAPI_CONNECTION_NAME } from './connectToXApiDatabase'

@Service()
export class XApiSqlRepository {
  constructor(
    @InjectRepository(XApiRecordSql, XAPI_CONNECTION_NAME)
    private readonly xapiEventRepository: Repository<XApiRecordSql>,
  ) {}

  async searchXApiEvents(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]> {
    let searchParams = {
      userId: Equal(userId),
    }

    const timeCondition =
      from && to
        ? Between(from, to)
        : from
        ? MoreThanOrEqual(from)
        : to
        ? LessThanOrEqual(to)
        : undefined
    if (timeCondition) {
      searchParams = Object.assign({}, searchParams, {
        serverTimestamp: timeCondition,
      })
    }

    const records = (await this.xapiEventRepository.find(
      searchParams,
    )) as XApiRecord[]
    return records
  }
}
