import { XApiRecord } from '..'
import { IXApiRepository } from '../repo'
import {
  Repository,
  Between,
  Equal,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm'
import { XApiRecordSql } from './entities'

export class XApiSqlRepository implements IXApiRepository {
  constructor(
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
