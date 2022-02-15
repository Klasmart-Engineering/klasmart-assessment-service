import { withLogger } from 'kidsloop-nodejs-logger'
import { XApiRecord } from '..'
import { IXApiRepository } from '../repo'
import {
  Repository,
  Between,
  Equal,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm'
import { XApiRecordSql } from './entities'

const logger = withLogger('XApiSqlRepository')

export class XApiSqlRepository implements IXApiRepository {
  constructor(
    private readonly xapiEventRepository: Repository<XApiRecordSql>,
  ) {}

  async searchXapiEventsWithRoomId(roomId: string): Promise<XApiRecord[]> {
    const searchParams = {
      roomId: Equal(roomId),
    }

    const records = (await this.xapiEventRepository.find(
      searchParams,
    )) as XApiRecord[]

    logger.debug(`searchXapiEventsWithRoomId >> roomId: ${roomId}`)
    return records
  }

  async groupSearchXApiEventsForUsers(
    userIds: string[],
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]> {
    let searchParams = {
      userId: In(userIds),
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

    logger.debug(
      `groupSearchXApiEventsForUsers >> userIds count: ${userIds.length}, from: ${from}, ` +
        ` to: ${to} => records found: ${records.length}`,
    )
    return records
  }

  async searchXApiEventsForUser(
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

    logger.debug(
      `searchXApiEventsForUser >> userId: ${userId}, from: ${from}, ` +
        ` to: ${to} => records found: ${records.length}`,
    )
    return records
  }
}
