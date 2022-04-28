import { Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'

import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { ParsedXapiEvent } from '../helpers/parsedXapiEvent'
import { Attendance } from '../web/attendance'
import { RoomEventsProvider } from './roomEventsProvider'
import { RoomMaterialsProvider } from './roomMaterialsProvider'
import { RoomScoresTemplateProvider } from './roomScoresTemplateProvider'
import { StudentContentsResult } from './cmsContentProvider'

const logger = withLogger('RoomScoresCalculator')

@Service()
export class RoomScoresCalculator {
  constructor(
    private readonly roomEventsProvider: RoomEventsProvider,
    private readonly roomMaterialsProvider: RoomMaterialsProvider,
    private readonly roomScoresTemplateProvider: RoomScoresTemplateProvider,
  ) {}

  public async calculate(
    roomId: string,
    teacherId: string,
    attendances: ReadonlyArray<Attendance>,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<UserContentScore>> {
    logger.debug(`calculate >> roomId: ${roomId}, teacherId: ${teacherId}`)
    const studentContentsResult = await this.roomMaterialsProvider.getMaterials(
      roomId,
      authenticationToken,
    )
    logger.debug(
      `calculate >> roomId: ${roomId} >> materials found: ${studentContentsResult.contents.size}`,
    )

    const h5pIdToContentIdMap = this.createH5pIdToContentIdMap(
      studentContentsResult.contents.values(),
    )
    // const userIds = new Set(attendances.map((x) => x.userId))
    // logger.debug(
    //   `calculate >> roomId: ${roomId} >> attendances found: ${userIds.size}`,
    // )
    // const xapiEvents = await this.roomEventsProvider.getEvents(
    //   roomId,
    //   attendances,
    //   h5pIdToContentIdMap,
    // )
    // logger.debug(
    //   `calculate >> roomId: ${roomId} >> xapiEvents found: ${xapiEvents.length}`,
    // )

    const userContentScores = await this.calculateScores(
      roomId,
      teacherId,
      studentContentsResult,
      [],
      h5pIdToContentIdMap,
    )
    logger.debug(
      `calculate >> roomId: ${roomId} >> userContentScores calculated: ${userContentScores.length}`,
    )

    return userContentScores
  }

  private createH5pIdToContentIdMap(
    materials: IterableIterator<Content>,
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
    studentContentsResult: StudentContentsResult,
    xapiEvents: ReadonlyArray<ParsedXapiEvent>,
    h5pIdToContentIdMap: ReadonlyMap<string, string>,
  ): Promise<ReadonlyArray<UserContentScore>> {
    logger.debug(`calculateScores >> roomId: ${roomId}`)
    const start = new Date()

    const mapKeyToUserContentScoreMap =
      await this.roomScoresTemplateProvider.getTemplate(
        roomId,
        teacherId,
        studentContentsResult,
        [],
      )

    // for (const xapiEvent of xapiEvents) {
    //   const contentId = h5pIdToContentIdMap.get(xapiEvent.h5pId)
    //   if (!contentId) {
    //     continue
    //   }
    //   // TODO: Replace the call to getCompatContentKey with the commented out line, below, after the content_id migration.
    //   //const contentKey = ContentKey.construct(contentId, xapiEvent.h5pSubId)
    //   const contentKey =
    //     await this.roomScoresTemplateProvider.getCompatContentKey(
    //       roomId,
    //       xapiEvent.userId,
    //       contentId,
    //       xapiEvent.h5pId,
    //       xapiEvent.h5pSubId,
    //     )
    //   const mapKey = RoomScoresTemplateProvider.getMapKey(
    //     roomId,
    //     xapiEvent.userId,
    //     contentKey,
    //   )
    //   const userContentScore = mapKeyToUserContentScoreMap.get(mapKey)
    //   if (!userContentScore) {
    //     continue
    //   }
    //   await userContentScore.applyEvent(xapiEvent)
    // }

    const end = new Date()
    const diff = end.getTime() - start.getTime()
    logger.info(`Diff: ${diff}`)

    return [...mapKeyToUserContentScoreMap.values()]
  }
}
