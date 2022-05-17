import { Inject, Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import ScheduleResponse, {
  ScheduleDto,
  StudentListResponse,
} from './scheduleResponse'
import { FetchWrapper } from '../fetchWrapper'
import DiKeys from '../../initialization/diKeys'
import { ErrorMessage } from '../../helpers/errorMessages'
import { UserInputError } from 'apollo-server-core'

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

  public async getStudentIds(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<StudentListResponse> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const requestUrl = `${this.baseUrl}/schedules/${scheduleId}/relation_ids`

    const response = await this.fetchWrapper.fetch<StudentListResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      },
    )
    if (!response) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(scheduleId))
    }

    return response
  }
}
