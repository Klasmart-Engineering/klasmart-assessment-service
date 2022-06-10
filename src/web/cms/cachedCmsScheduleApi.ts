import { Inject, Service } from 'typedi'
import { ICache } from '../../cache'
import DiKeys from '../../initialization/diKeys'
import { CmsScheduleApi } from './cmsScheduleApi'
import { ScheduleDto, StudentListResponse } from './scheduleResponse'

export const getScheduleKey = (key: string) => `getSchedule:${key}`
export const getStudentIdsKey = (key: string) => `getStudentIds:${key}`

@Service()
export class CachedCmsScheduleApi {
  public constructor(
    private readonly cmsScheduleApi: CmsScheduleApi,
    @Inject(DiKeys.ICache)
    private readonly cache: ICache,
    private readonly ttlSeconds = 24 * 60 * 60,
  ) {}

  public async getSchedule(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<ScheduleDto | undefined> {
    const key = getScheduleKey(scheduleId)
    const cached = await this.cache.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    const dto = await this.cmsScheduleApi.getSchedule(
      scheduleId,
      authenticationToken,
    )
    if (dto) {
      const json = JSON.stringify(dto)
      await this.cache.set(key, json, this.ttlSeconds)
    }

    return dto
  }

  public async getStudentIds(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<StudentListResponse> {
    const key = getStudentIdsKey(scheduleId)
    const cached = await this.cache.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    const response = await this.cmsScheduleApi.getStudentIds(
      scheduleId,
      authenticationToken,
    )
    if (response) {
      const json = JSON.stringify(response)
      await this.cache.set(key, json, this.ttlSeconds)
    }

    return response
  }
}
