import { XApiRecord } from './interfaces'

export interface IXApiRepository {
  searchXapiEventsWithRoomId(roomId: string): Promise<XApiRecord[]>

  groupSearchXApiEventsForUsers(
    userIds: string[],
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]>

  searchXApiEventsForUser(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]>
}
