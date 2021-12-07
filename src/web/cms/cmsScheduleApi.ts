import fetch from 'node-fetch'
import { Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'
import ScheduleResponse, { ScheduleDto } from './scheduleResponse'
import { throwExpression } from '../../helpers/throwExpression'

const logger = withLogger('CmsScheduleApi')

@Service()
export class CmsScheduleApi {
  public async getSchedule(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<ScheduleDto | undefined> {
    // TODO: Think about moving this check to the source (fail early).
    if (!authenticationToken) {
      throw new Error(
        `[CmsScheduleApi.getSchedule] authenticationToken is undefined.`,
      )
    }
    const cmsApiUrl =
      process.env.CMS_API_URL ?? throwExpression('CMS_API_URL is undefined')
    const schedulesApiUrl = `${cmsApiUrl}/schedules?schedule_ids=${scheduleId}`

    const fetchPromise = fetch(schedulesApiUrl, {
      method: 'GET',
      headers: {
        cookie: `access=${authenticationToken}`,
      },
    })

    const response = await fetchPromise
    if (!response.ok) {
      logger.error(`getSchedule failed. response status: ${response.status}.`)
      return undefined
    }
    const body = await response.json()
    const scheduleResponse = body as ScheduleResponse | undefined

    if (!scheduleResponse?.total) {
      return undefined
    }

    const scheduleItem = scheduleResponse.data?.[0]

    return scheduleItem
  }
}
