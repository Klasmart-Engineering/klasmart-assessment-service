import { UserInputError } from 'apollo-server-express'
import { Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Logger } from 'winston'

import { Content } from '../db/cms/entities'
import { ErrorMessage } from '../helpers/errorMessages'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'

@Service()
export class RoomMaterialsProvider {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      RoomMaterialsProvider._logger ||
      (RoomMaterialsProvider._logger = withLogger('RoomMaterialsProvider'))
    )
  }

  public constructor(
    private readonly cmsScheduleProvider: CmsScheduleProvider,
    private readonly cmsContentProvider: CmsContentProvider,
  ) {}

  public async getMaterials(
    roomId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<Content>> {
    const schedule = await this.cmsScheduleProvider.getSchedule(
      roomId,
      authenticationToken,
    )
    if (!schedule) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
    }
    const lessonPlanId = schedule.lessonPlanId
    const lessonMaterials = await this.cmsContentProvider.getLessonMaterials(
      roomId,
      lessonPlanId,
      authenticationToken,
    )
    this.Logger.debug(
      `getMaterials >> roomId: ${roomId} => lessonPlanId: ${lessonPlanId} ` +
        `=> lessonMaterials found: ${lessonMaterials.length}`,
    )
    return lessonMaterials
  }
}
