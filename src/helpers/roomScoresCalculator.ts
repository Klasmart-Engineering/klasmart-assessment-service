import { Inject, Service } from 'typedi'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { Attendance } from '../api'
import { RoomAttendanceProvider } from './roomAttendanceProvider'
import { RoomEventsProvider } from './roomEventsProvider'
import { RoomMaterialsProvider } from './roomMaterialsProvider'
import { ParsedXapiEvent } from './parsedXapiEvent'
import { RoomScoresTemplateProvider } from './roomScoresTemplateProvider'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Logger } from 'winston'

@Service()
export class RoomScoresCalculator {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      RoomScoresCalculator._logger ||
      (RoomScoresCalculator._logger = withLogger('RoomScoresCalculator'))
    )
  }

  constructor(
    @Inject('RoomAttendanceProvider')
    private readonly roomAttendanceProvider: RoomAttendanceProvider,
    private readonly roomEventsProvider: RoomEventsProvider,
    private readonly roomMaterialsProvider: RoomMaterialsProvider,
    private readonly roomScoresTemplateProvider: RoomScoresTemplateProvider,
  ) { }

  public async calculate(
    roomId: string,
    teacherId: string,
  ): Promise<UserContentScore[]> {
    const materials = await this.roomMaterialsProvider.getMaterials(roomId)
    const h5pIdToContentIdMap = this.createH5pIdToContentIdMap(materials)
    const attendances = await this.roomAttendanceProvider.getAttendances(roomId)
    const xapiEvents = await this.roomEventsProvider.getEvents(
      roomId,
      attendances,
    )
    const userContentScores = await this.calculateScores(
      roomId,
      teacherId,
      materials,
      attendances,
      xapiEvents,
      h5pIdToContentIdMap,
    )

    return userContentScores
  }

  private createH5pIdToContentIdMap(materials: Content[]): Map<string, string> {
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
    materials: Content[],
    attendances: Attendance[],
    xapiEvents: ParsedXapiEvent[],
    h5pIdToContentIdMap: Map<string, string>,
  ): Promise<UserContentScore[]> {
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
        this.Logger.warn(
          `h5pId (${xapiEvent.h5pId}) not part of the lesson plan. Skipping event...`,
        )
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
