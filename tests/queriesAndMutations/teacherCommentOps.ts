import EndUser from '../entities/endUser'
import { testClient } from '../utils/globalIntegrationTestHooks'
import { gqlTry } from '../utils/gqlTry'
import { GqlTeacherComment, USER } from './gqlInterfaces'

export async function setTeacherCommentMutation(
  roomId: string,
  studentId: string,
  comment: string,
  endUser: EndUser,
  logErrors = true,
): Promise<GqlTeacherComment | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: SET_TEACHER_COMMENT,
      variables: {
        roomId: roomId,
        studentId: studentId,
        comment: comment,
      },
      headers: { authorization: endUser.token },
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.setComment as GqlTeacherComment
}

const SET_TEACHER_COMMENT = `
mutation SetComment($roomId: String!, $studentId: String!, $comment: String!) {
  setComment(
    room_id: $roomId
    student_id: $studentId
    comment: $comment
  ) {
    date
    lastUpdated
    comment
    ${USER('teacher')}
    ${USER('student')}
  }
}
`
