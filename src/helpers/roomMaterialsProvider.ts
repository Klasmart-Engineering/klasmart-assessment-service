import { UserInputError } from 'apollo-server-express'
import { Service } from 'typedi'
import { In, Repository } from 'typeorm'
import { Content, Schedule } from '../db/cms/entities'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'
import { ErrorMessage } from './errorMessages'
import { ILogger, Logger } from './logger'

@Service()
export class RoomMaterialsProvider {
  private static _logger: ILogger
  private get Logger(): ILogger {
    return (
      RoomMaterialsProvider._logger ||
      (RoomMaterialsProvider._logger = Logger.get('RoomMaterialsProvider'))
    )
  }

  public constructor(
    private readonly cmsScheduleProvider: CmsScheduleProvider,
    private readonly cmsContentProvider: CmsContentProvider,
  ) {}

  public async getMaterials(roomId: string): Promise<Content[]> {
    const schedule = await this.cmsScheduleProvider.getSchedule(roomId)
    if (!schedule) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
    }
    const lessonPlanId = schedule.lessonPlanId
    const lessonMaterials = await this.cmsContentProvider.getLessonMaterials(
      lessonPlanId,
    )
    return lessonMaterials
  }
}
