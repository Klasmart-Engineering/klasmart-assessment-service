import { XApiRecordBuilder } from '../builders'
import { XApiRecord } from '../../src/db/xapi'

type CreateXapiEventsOptions = {
  rooms?: number
  users?: number
  activities?: number
  events?: number
  roomPrefix?: string
}

export const createXapiEvents = ({
  rooms: numRooms = 2,
  users: numUsers = 2,
  activities: numActivities = 2,
  events: numEvents = 5,
  roomPrefix = '',
}: CreateXapiEventsOptions): XApiRecord[] => {
  const rawXapiEvents: XApiRecord[] = []
  const curr_time = 1647865897520 || Date.now()
  for (const rId of [...Array(numRooms).keys()]) {
    for (const uId of [...Array(numUsers).keys()]) {
      for (const hId of [...Array(numActivities).keys()]) {
        for (const eId of [...Array(numEvents).keys()]) {
          const roomId = `${roomPrefix}room${rId}`
          const userId = `user${uId}`
          const h5pId = `h5pId${hId}`
          const h5pName = `h5pName${hId}`
          const h5pType = `h5pType${hId}`
          const score = { min: 0, max: 2, raw: 1 }
          const response = `${roomId}, ${userId}, ${h5pId} >> event${eId}`
          const i = uId * numUsers + hId * numActivities + eId

          const xapiRecord = new XApiRecordBuilder()
            .withRoomId(roomId)
            .withUserId(userId)
            .withH5pId(h5pId)
            .withH5pSubId(undefined)
            .withH5pName(h5pName)
            .withH5pType(h5pType)
            .withScore(score)
            .withResponse(response)
            .withServerTimestamp(curr_time + i)
            .withClientTimestamp(curr_time + i)
            .build()
          rawXapiEvents.push(xapiRecord)
        }
      }
    }
  }
  return rawXapiEvents
}
