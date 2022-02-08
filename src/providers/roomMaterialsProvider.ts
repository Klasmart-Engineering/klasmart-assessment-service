import { UserInputError } from 'apollo-server-express'
import { Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'

import { Content } from '../db/cms/entities'
import { ErrorMessage } from '../helpers/errorMessages'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'

const logger = withLogger('RoomEventsProvider')

@Service()
export class RoomMaterialsProvider {
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
    logger.debug(
      `getMaterials >> roomId: ${roomId} => lessonPlanId: ${lessonPlanId} ` +
        `=> lessonMaterials found: ${lessonMaterials.length}`,
    )
    return lessonMaterials
  }
}
