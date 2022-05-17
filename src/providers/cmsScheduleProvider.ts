import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
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

  public async getStudentIds(
    scheduleId: string,
    authenticationToken?: string,
  ): Promise<readonly string[]> {
    const response = await this.cmsScheduleApi.getStudentIds(
      scheduleId,
      authenticationToken,
    )
    const studentIds: string[] = []
    if (response.class_roster_student_ids) {
      studentIds.push(...response.class_roster_student_ids)
    }
    if (response.participant_student_ids) {
      studentIds.push(...response.participant_student_ids)
    }

    return studentIds
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
