import { XApiRecordBuilder } from '../builders'
import { XApiRecord } from '../../src/db/xapi'

type CreateXapiEventsOptions = {
  rooms?: number
  users?: number
  activities?: number
  events?: number
  roomPrefix?: string
  withInvalidProbability?: number
}

// generates xapi events as cartesian product of combinations
export const createXapiEvents = ({
  rooms: numRooms = 2,
  users: numUsers = 2,
  activities: numActivities = 2,
  events: numEvents = 5,
  roomPrefix = '',
  withInvalidProbability = 0,
}: CreateXapiEventsOptions): XApiRecord[] => {
  const rawXapiEvents: XApiRecord[] = []
  const curr_time = 100000000000
  let k = 0
  for (const rId of [...Array(numRooms).keys()]) {
    for (const uId of [...Array(numUsers).keys()]) {
      for (const hId of [...Array(numActivities).keys()]) {
        for (const eId of [...Array(numEvents).keys()]) {
          k += 1
          const i = uId * numUsers + hId * numActivities + eId
          let roomId: string | undefined = `${roomPrefix}room${rId}`
          let userId: string | undefined = `user${uId}`
          const h5pId = `h5pId${hId}`
          const h5pName = `h5pName${hId}`
          const h5pType = `h5pType${hId}`
          let score: any | undefined = { min: 0, max: 2, raw: 1 }
          let response:
            | string
            | undefined = `(${k}) ${roomId}, ${userId}, ${h5pId} >> event${eId}`
          let timestamp: number | undefined = curr_time + i

          if (withInvalidProbability) {
            if (Math.random() < withInvalidProbability) {
              const rand = Math.random()
              if (rand > 0.8) {
                roomId = undefined
              } else if (rand > 0.6) {
                userId = undefined
              } else if (rand > 0.4) {
                score = undefined
              } else if (rand > 0.2) {
                response = undefined
              } else {
                timestamp = undefined
              }
            }
          }

          const xapiRecord = new XApiRecordBuilder()
            .withRoomId(roomId)
            .withUserId(userId)
            .withH5pId(h5pId)
            .withH5pSubId(undefined)
            .withH5pName(h5pName)
            .withH5pType(h5pType)
            .withScore(score)
            .withResponse(response)
            .withServerTimestamp(timestamp)
            .withClientTimestamp(timestamp)
            .build()
          rawXapiEvents.push(xapiRecord)
        }
      }
    }
  }
  return rawXapiEvents
}
