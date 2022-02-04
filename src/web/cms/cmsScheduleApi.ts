import { Inject, Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'
import ScheduleResponse, { ScheduleDto } from './scheduleResponse'
import { FetchWrapper } from '../fetchWrapper'
import DiKeys from '../../initialization/diKeys'
import { ErrorMessage } from '../../helpers/errorMessages'

const logger = withLogger('CmsScheduleApi')

@Service()
export class CmsScheduleApi {
  public constructor(
    private readonly fetchWrapper: FetchWrapper,
    @Inject(DiKeys.CmsApiUrl)
    private readonly baseUrl: string,
  ) {}

  public async getSchedule(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<ScheduleDto | undefined> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const requestUrl = `${this.baseUrl}/schedules?schedule_ids=${scheduleId}`

    const response = await this.fetchWrapper.fetch<ScheduleResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      },
    )

    const dtos = response?.data ?? []
    logger.debug(
      `getSchedule >> scheduleId: ${scheduleId}, ` +
        `Schedules found: ${dtos.length}`,
    )

    if (dtos.length === 0) {
      return undefined
    }

    return dtos[0]
  }
}
