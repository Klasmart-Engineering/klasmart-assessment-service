import { Inject, Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'

import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { ParsedXapiEvent } from '../helpers/parsedXapiEvent'
import { Attendance } from '../web/attendance'
import { RoomAttendanceProvider } from './roomAttendanceProvider'
import { RoomEventsProvider } from './roomEventsProvider'
import { RoomMaterialsProvider } from './roomMaterialsProvider'
import { RoomScoresTemplateProvider } from './roomScoresTemplateProvider'

const logger = withLogger('RoomScoresCalculator')

@Service()
export class RoomScoresCalculator {
  constructor(
    @Inject('RoomAttendanceProvider')
    private readonly roomAttendanceProvider: RoomAttendanceProvider,
    private readonly roomEventsProvider: RoomEventsProvider,
    private readonly roomMaterialsProvider: RoomMaterialsProvider,
    private readonly roomScoresTemplateProvider: RoomScoresTemplateProvider,
  ) {}

  public async calculate(
    roomId: string,
    teacherId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<UserContentScore>> {
    logger.debug(`calculate >> roomId: ${roomId}, teacherId: ${teacherId}`)
    const materials = await this.roomMaterialsProvider.getMaterials(
      roomId,
      authenticationToken,
    )
    logger.debug(
      `calculate >> roomId: ${roomId} >> materials found: ${materials.length}`,
    )

    const h5pIdToContentIdMap = this.createH5pIdToContentIdMap(materials)
    const attendances = await this.roomAttendanceProvider.getAttendances(roomId)
    logger.debug(
      `calculate >> roomId: ${roomId} >> attendances found: ${attendances.length}`,
    )

    const xapiEvents = await this.roomEventsProvider.getEvents(
      roomId,
      attendances,
      h5pIdToContentIdMap,
    )
    logger.debug(
      `calculate >> roomId: ${roomId} >> xapiEvents found: ${xapiEvents.length}`,
    )

    const userContentScores = await this.calculateScores(
      roomId,
      teacherId,
      materials,
      attendances,
      xapiEvents,
      h5pIdToContentIdMap,
    )
    logger.debug(
      `calculate >> roomId: ${roomId} >> userContentScores calculated: ${userContentScores.length}`,
    )

    return userContentScores
  }

  private createH5pIdToContentIdMap(
    materials: ReadonlyArray<Content>,
  ): ReadonlyMap<string, string> {
    const h5pIdToContentIdMap = new Map<string, string>()
    for (const x of materials) {
      if (x.h5pId) {
        h5pIdToContentIdMap.set(x.h5pId, x.contentId)
      }
    }
    return h5pIdToContentIdMap
  }

  private async calculateScores(
    roomId: string,
    teacherId: string,
    materials: ReadonlyArray<Content>,
    attendances: ReadonlyArray<Attendance>,
    xapiEvents: ReadonlyArray<ParsedXapiEvent>,
    h5pIdToContentIdMap: ReadonlyMap<string, string>,
  ): Promise<ReadonlyArray<UserContentScore>> {
    logger.debug(`calculateScores >> roomId: ${roomId}`)
    const mapKeyToUserContentScoreMap =
      await this.roomScoresTemplateProvider.getTemplate(
        roomId,
        teacherId,
        materials,
        attendances,
        xapiEvents,
      )

    for (const xapiEvent of xapiEvents) {
      const contentId = h5pIdToContentIdMap.get(xapiEvent.h5pId)
      if (!contentId) {
        continue
      }
      // TODO: Replace the call to getCompatContentKey with the commented out line, below, after the content_id migration.
      //const contentKey = ContentKey.construct(contentId, xapiEvent.h5pSubId)
      const contentKey =
        await this.roomScoresTemplateProvider.getCompatContentKey(
          roomId,
          xapiEvent.userId,
          contentId,
          xapiEvent.h5pId,
          xapiEvent.h5pSubId,
        )
      const mapKey = RoomScoresTemplateProvider.getMapKey(
        roomId,
        xapiEvent.userId,
        contentKey,
      )
      const userContentScore = mapKeyToUserContentScoreMap.get(mapKey)
      if (!userContentScore) {
        continue
      }
      await userContentScore.applyEvent(xapiEvent)
    }
    return [...mapKeyToUserContentScoreMap.values()]
  }
}
