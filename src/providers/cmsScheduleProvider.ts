import { withLogger } from 'kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Schedule } from '../db/cms/entities/schedule'
import { throwExpression } from '../helpers/throwExpression'
import { CmsScheduleApi, ScheduleDto } from '../web/cms'

const logger = withLogger('CmsScheduleProvider')

@Service()
export class CmsScheduleProvider {
  constructor(private readonly cmsScheduleApi: CmsScheduleApi) {}

  public async getSchedule(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<Schedule | undefined> {
    const dto = await this.cmsScheduleApi.getSchedule(
      scheduleId,
      authenticationToken,
    )
    logger.debug(`getSchedule >> Schedule with ID ${scheduleId} FOUND`)
    if (!dto) return undefined
    const lessonMaterial = scheduleDtoToEntity(dto)

    return lessonMaterial
  }
}

function scheduleDtoToEntity(dto: ScheduleDto) {
  return new Schedule(
    dto.id ?? throwExpression('schedule.id is undefined'),
    dto.lesson_plan_id ??
      throwExpression('schedule.lesson_plan_id is undefined'),
    dto.org_id ?? throwExpression('schedule.org_id is undefined'),
  )
}
