import { Inject, Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'

import { XApiRecord } from '../db/xapi'
import { IXApiRepository } from '../db/xapi/repo'
import { ParsedXapiEvent } from '../helpers/parsedXapiEvent'
import { Attendance } from '../web/attendance'
import DiKeys from '../initialization/diKeys'

const logger = withLogger('RoomEventsProvider')

@Service()
export class RoomEventsProvider {
  constructor(
    @Inject(DiKeys.IXApiRepository)
    private readonly xapiRepository: IXApiRepository,
  ) {}

  public async getEvents(
    roomId: string,
    attendances: ReadonlyArray<Attendance>,
    h5pIdToContentIdMap: ReadonlyMap<string, string>,
  ): Promise<ReadonlyArray<ParsedXapiEvent>> {
    const parsedXapiEvents: ParsedXapiEvent[] = []
    logger.debug(
      `getEvents >> roomId ${roomId}, attendances count: ${attendances.length}`,
    )
    for (const { userId, joinTimestamp, leaveTimestamp } of attendances) {
      const rawXapiEvents = await this.xapiRepository.searchXApiEvents(
        userId,
        joinTimestamp.getTime(),
        leaveTimestamp.getTime(),
      )
      parsedXapiEvents.push(
        ...this.parseEvents(roomId, rawXapiEvents, h5pIdToContentIdMap),
      )
    }
    return parsedXapiEvents
  }

  private parseEvents(
    roomId: string,
    rawXapiEvents: ReadonlyArray<XApiRecord>,
    h5pIdToContentIdMap: ReadonlyMap<string, string>,
  ): ParsedXapiEvent[] {
    const h5pIdsThatArentPartOfLessonPlan = new Set<string>()
    const parsedXapiEvents: ParsedXapiEvent[] = []
    for (const rawXapiEvent of rawXapiEvents) {
      const parsedEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)
      if (parsedEvent) {
        if (h5pIdToContentIdMap.has(parsedEvent.h5pId)) {
          parsedXapiEvents.push(parsedEvent)
          continue
        }
        h5pIdsThatArentPartOfLessonPlan.add(parsedEvent.h5pId)
      }
    }
    if (h5pIdsThatArentPartOfLessonPlan.size > 0) {
      const h5pIds = h5pIdsThatArentPartOfLessonPlan.toString()
      logger.debug(
        `Filtered out events that aren't part of the lesson plan for roomId [${roomId}]. h5pIds: ${h5pIds}`,
      )
    }
    return parsedXapiEvents
  }
}
