import EndUser from '../entities/endUser'
import { testClient } from '../utils/globalIntegrationTestHooks'
import { gqlTry } from '../utils/gqlTry'
import {
  TEACHER_COMMENTS,
  SCORES_BY_USER,
  SCORES_BY_CONTENT,
  TEACHER_COMMENTS_BY_STUDENT,
  GqlScore,
  GqlTeacherComment,
  GqlScoresByUser,
  GqlScoresByContent,
  GqlTeacherCommentsByStudent,
  CONTENT_SCORES,
} from './gqlInterfaces'

export async function roomQuery(
  roomId: string,
  endUser: EndUser,
  logErrors = true,
): Promise<GqlRoom | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: ROOM,
      variables: { roomId: roomId },
      headers: { authorization: endUser.token },
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.Room as GqlRoom
}

export async function roomQueryWithCookie(
  roomId: string,
  cookies?: { access?: string },
  logErrors = true,
): Promise<GqlRoom | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: ROOM,
      variables: { roomId: roomId },
      cookies: cookies,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.Room as GqlRoom
}

export const ROOM = `
query Room($roomId: String) {
  Room(room_id: $roomId) {
    room_id
    ${CONTENT_SCORES}
    ${TEACHER_COMMENTS}
    ${SCORES_BY_USER}
    ${SCORES_BY_CONTENT}
    ${TEACHER_COMMENTS_BY_STUDENT}
  }
}
`
export interface GqlRoom {
  room_id?: string
  scores?: GqlScore[]
  teacherComments?: GqlTeacherComment[]
  scoresByUser?: GqlScoresByUser[]
  scoresByContent?: GqlScoresByContent[]
  teacherCommentsByStudent?: GqlTeacherCommentsByStudent[]
}
