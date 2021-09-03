import { Service } from 'typedi'
import { Attendance } from '../db/users/entities'
import { XApiRecord, XApiRepository } from '../db/xapi'
import { ParsedXapiEvent } from './parsedXapiEvent'

@Service()
export class RoomEventsProvider {
  constructor(private readonly xapiRepository: XApiRepository) {}

  public async getEvents(
    roomId: string,
    attendances: Attendance[],
  ): Promise<ParsedXapiEvent[]> {
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
    rawXapiEvents: XApiRecord[],
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
