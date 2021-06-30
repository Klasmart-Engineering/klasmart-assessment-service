import EndUser from '../entities/endUser'
import { testClient } from '../utils/globalIntegrationTestHooks'
import { gqlTry } from '../utils/gqlTry'
import { CONTENT, GqlTeacherScore, USER } from './gqlInterfaces'

export async function setTeacherScoreMutation(
  roomId: string,
  studentId: string,
  contentId: string,
  score: number,
  endUser: EndUser,
  logErrors = true,
): Promise<GqlTeacherScore | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: SET_TEACHER_SCORE,
      variables: {
        roomId: roomId,
        studentId: studentId,
        contentId: contentId,
        score: score,
      },
      headers: { authorization: endUser.token },
    })

  const res = await gqlTry(operation, logErrors)
  return res.data?.setScore as GqlTeacherScore
}

const SET_TEACHER_SCORE = `
mutation SetScore($roomId: String!, $studentId: String!, $contentId: String!, $score: Float!) {
  setScore(
    room_id: $roomId
    student_id: $studentId
    content_id: $contentId
    score: $score
  ) {
    date
    lastUpdated
    score
    ${USER('teacher')}
    ${USER('student')}
    ${CONTENT}
  }
}
`
