import fetch from 'node-fetch'
import { Service } from 'typedi'
import ScheduleResponse, { ScheduleDto } from './scheduleResponse'

@Service()
export class CmsScheduleApi {
  public async getSchedule(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<ScheduleDto | undefined> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const schedulesApiUrl = `${cmsApiUrl}/schedules?schedule_ids=${scheduleId}`

    const fetchPromise = fetch(schedulesApiUrl, {
      method: 'GET',
      headers: {
        cookie: authenticationToken ? `access=${authenticationToken}` : '',
      },
    })

    const response = await fetchPromise
    const body = await response.json()
    const scheduleResponse = body as ScheduleResponse | undefined

    if (!scheduleResponse?.total) {
      return undefined
    }

    const scheduleItem = scheduleResponse.data?.[0]

    return scheduleItem
  }
}
