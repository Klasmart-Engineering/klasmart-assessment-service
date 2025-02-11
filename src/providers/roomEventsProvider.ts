import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Inject, Service } from 'typedi'

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
    logger.debug(
      `getEvents >> roomId ${roomId}, attendances count: ${attendances.length}`,
    )

    let rawXapiEvents: XApiRecord[] = []

    // method 1 -> with roomId
    rawXapiEvents = await this.xapiRepository.searchXapiEventsWithRoomId(roomId)
    if (rawXapiEvents.length > 0) {
      const parsedXapiEvents: ReadonlyArray<ParsedXapiEvent> = this.parseEvents(
        roomId,
        rawXapiEvents,
        h5pIdToContentIdMap,
      )
      return parsedXapiEvents
    }

    // method 2 -> with list of users
    if (rawXapiEvents.length === 0) {
      const userIds = attendances.map((a) => a.userId)
      const earliestJoinTimestamp = Math.min(
        ...attendances.map((a) => a.joinTimestamp.getTime()),
      )
      const latestLeaveTimestamp = Math.max(
        ...attendances.map((a) => a.leaveTimestamp.getTime()),
      )
      rawXapiEvents = await this.xapiRepository.groupSearchXApiEventsForUsers(
        userIds,
        earliestJoinTimestamp,
        latestLeaveTimestamp,
      )

      if (rawXapiEvents.length > 0) {
        const userIdToAttendanceMap = new Map<string, Attendance>(
          attendances.map((attendance) => [attendance.userId, attendance]),
        )

        const parsedXapiEvents: ReadonlyArray<ParsedXapiEvent> =
          this.parseEvents(roomId, rawXapiEvents, h5pIdToContentIdMap).filter(
            (event) => {
              const { userId, timestamp } = event
              const attendance = userIdToAttendanceMap.get(userId)

              if (attendance === undefined) {
                return false
              }
              const { joinTimestamp, leaveTimestamp } = attendance
              const eventIsWithinAttendanceTimeRange =
                joinTimestamp.getTime() < timestamp &&
                timestamp < leaveTimestamp.getTime()

              return eventIsWithinAttendanceTimeRange
            },
          )
        return parsedXapiEvents
      }
    }

    // method 3 -> loop over users
    if (rawXapiEvents.length === 0) {
      rawXapiEvents = (
        await Promise.all(
          attendances.map(({ userId, joinTimestamp, leaveTimestamp }) =>
            this.xapiRepository.searchXApiEventsForUser(
              userId,
              joinTimestamp.getTime(),
              leaveTimestamp.getTime(),
            ),
          ),
        )
      ).flatMap((x) => x)
      const parsedXapiEvents = this.parseEvents(
        roomId,
        rawXapiEvents,
        h5pIdToContentIdMap,
      )
      return parsedXapiEvents
    }

    return []
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

    this.populateUndefinedH5pTypesWithParentType(parsedXapiEvents)

    return parsedXapiEvents
  }

  private populateUndefinedH5pTypesWithParentType(
    parsedXapiEvents: ReadonlyArray<ParsedXapiEvent>,
  ) {
    const h5pWithChildren = new Set<string>()
    for (const x of parsedXapiEvents) {
      if (x.h5pParentId != null) {
        h5pWithChildren.add(x.h5pParentId)
      }
    }
    const parentKeyToEventMap = new Map<string, ParsedXapiEvent>()
    for (const x of parsedXapiEvents) {
      if (!x.h5pSubId && h5pWithChildren.has(x.h5pId)) {
        parentKeyToEventMap.set(x.h5pId, x)
      }
      if (x.h5pSubId && h5pWithChildren.has(x.h5pSubId)) {
        parentKeyToEventMap.set(`${x.h5pId}|${x.h5pSubId}`, x)
      }
    }
    for (const x of parsedXapiEvents) {
      if (x.h5pSubId == null) {
        continue
      }
      let current: ParsedXapiEvent | undefined = x
      while (current != null && current.h5pType == null) {
        const key =
          current.h5pParentId === current.h5pId
            ? current.h5pId
            : `${current.h5pId}|${current.h5pParentId}`
        const parent = parentKeyToEventMap.get(key)
        current.h5pType = parent?.h5pType
        if (current.h5pType == null) {
          current = parent
        }
      }
    }
  }
}
