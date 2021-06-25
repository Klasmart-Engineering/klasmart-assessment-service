import EndUser from '../entities/endUser'
import { testClient } from '../utils/globalIntegrationTestHooks'
import { gqlTry } from '../utils/gqlTry'
import { RoomQuery } from './gqlInterfaces'

export const ROOM = `
query Room($roomId: String) {
  Room(room_id: $roomId) {
    room_id
    scores {
      seen
      teacherScores {
        date
        lastUpdated
        score
        teacher {
          user_id
          given_name
          family_name
        }
        student {
          user_id
          given_name
          family_name
        }
        content {
          content_id
          subcontent_id
          type
          name
          h5p_id
          fileType
        }
      }
      user {
        user_id
        given_name
        family_name
      }
      score {
        min
        max
        sum
        scoreFrequency
        mean
        scores
        answers {
          date
          answer
          score
          minimumPossibleScore
          maximumPossibleScore
        }
        median
        medians
      }
      content {
        content_id
        subcontent_id
        type
        name
        h5p_id
        fileType
      }
    }
  }
}
`

export async function roomQuery(
  roomId: string,
  endUser: EndUser,
  logErrors = true,
): Promise<RoomQuery | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: ROOM,
      variables: { roomId: roomId },
      headers: { authorization: endUser.token },
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.Room as RoomQuery
}
