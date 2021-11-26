import { Service } from 'typedi'
import { Schedule } from '../db/cms/entities/schedule'
import { throwExpression } from '../helpers/throwExpression'
import { CmsScheduleApi, ScheduleDto } from '../web/cms'

@Service()
export class CmsScheduleProvider {
  constructor(private readonly cmsScheduleApi: CmsScheduleApi) {}

  public async getSchedule(scheduleId: string): Promise<Schedule | undefined> {
    const dto = await this.cmsScheduleApi.getSchedule(scheduleId)
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
