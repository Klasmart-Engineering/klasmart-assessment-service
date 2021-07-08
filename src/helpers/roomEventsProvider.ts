import { Service } from 'typedi'
import { Attendance } from '../db/users/entities'
import { XAPIRecord, XAPIRepository } from '../db/xapi/repo'
import { ParsedXapiEvent } from './parsedXapiEvent'

@Service()
export class RoomEventsProvider {
  constructor(private readonly xapiRepository: XAPIRepository) {}

  public async getEvents(
    roomId: string,
    attendances: Attendance[],
  ): Promise<ParsedXapiEvent[]> {
    const parsedXapiEvents: ParsedXapiEvent[] = []
    for (const { userId, joinTimestamp, leaveTimestamp } of attendances) {
      const xapiEvents = await this.xapiRepository.searchXApiEvents(
        userId,
        joinTimestamp.getTime(),
        leaveTimestamp.getTime(),
      )
      if (!xapiEvents) {
        continue
      }
      parsedXapiEvents.push(...this.parseEvents(roomId, xapiEvents))
    }
    return parsedXapiEvents
  }

  private parseEvents(
    roomId: string,
    rawXapiEvents: XAPIRecord[],
  ): ParsedXapiEvent[] {
    const parsedXapiEvents: ParsedXapiEvent[] = []
    for (const rawXapiEvent of rawXapiEvents) {
      if (!rawXapiEvent) {
        continue
      }
      const parsedEvent = ParsedXapiEvent.parseRawEvent(roomId, rawXapiEvent)
      if (parsedEvent) {
        parsedXapiEvents.push(parsedEvent)
      }
    }
    return parsedXapiEvents
  }
}
