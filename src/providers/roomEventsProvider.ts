import { Inject, Service } from 'typedi'
import { XApiRecord } from '../db/xapi'
import { IXApiRepository } from '../db/xapi/repo'
import { ParsedXapiEvent } from '../helpers/parsedXapiEvent'
import { Attendance } from '../web/attendance'

@Service()
export class RoomEventsProvider {
  constructor(
    @Inject('IXApiRepository')
    private readonly xapiRepository: IXApiRepository,
  ) {}

  public async getEvents(
    roomId: string,
    attendances: ReadonlyArray<Attendance>,
  ): Promise<ReadonlyArray<ParsedXapiEvent>> {
    const parsedXapiEvents: ParsedXapiEvent[] = []
    for (const { userId, joinTimestamp, leaveTimestamp } of attendances) {
      const rawXapiEvents = await this.xapiRepository.searchXApiEvents(
        userId,
        joinTimestamp.getTime(),
        leaveTimestamp.getTime(),
      )
      parsedXapiEvents.push(...this.parseEvents(roomId, rawXapiEvents))
    }
    return parsedXapiEvents
  }

  private parseEvents(
    roomId: string,
    rawXapiEvents: ReadonlyArray<XApiRecord>,
  ): ParsedXapiEvent[] {
    const parsedXapiEvents: ParsedXapiEvent[] = []
    for (const rawXapiEvent of rawXapiEvents) {
      const parsedEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)
      if (parsedEvent) {
        parsedXapiEvents.push(parsedEvent)
      }
    }
    return parsedXapiEvents
  }
}
