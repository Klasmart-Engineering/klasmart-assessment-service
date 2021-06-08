import { Service } from 'typedi'
import { UserContentScore, Answer } from '../db/assessments/entities'
import { Attendance } from '../db/users/entities'
import { XAPIRepository, XAPIRecord } from '../db/xapi/repo'

@Service()
export class RoomScoresCalculator {
  constructor(private readonly xapiRepository: XAPIRepository) {}

  public async calculate(
    roomId: string,
    attendances: Attendance[],
  ): Promise<UserContentScore[]> {
    const userContentScores = new Map<string, UserContentScore>()
    const sessionHandled: { [indexer: string]: string } = {}
    for (const {
      sessionId,
      userId,
      joinTimestamp,
      leaveTimestamp,
    } of attendances) {
      if (!sessionHandled[sessionId]) {
        sessionHandled[sessionId] = sessionId
      } else {
        continue
      }

      const timezoneOffset = joinTimestamp.getTimezoneOffset() * 60000
      const xapiEvents = await this.xapiRepository.searchXApiEvents(
        userId,
        joinTimestamp.getTime() - timezoneOffset,
        leaveTimestamp.getTime() - timezoneOffset,
      )
      console.log(`events: ${xapiEvents?.length ?? 0}`)
      if (!xapiEvents) {
        continue
      }
      this.applyEventsToUserContentScore(
        roomId,
        userId,
        xapiEvents,
        userContentScores,
      )
    }
    return [...userContentScores.values()]
  }

  private applyEventsToUserContentScore(
    roomId: string,
    userId: string,
    xapiEvents: XAPIRecord[],
    userContentScores: Map<string, UserContentScore>,
  ): void {
    for (const event of xapiEvents) {
      if (!event) {
        continue
      }
      //console.log(JSON.stringify(event))
      try {
        const clientTimestamp = event?.xapi?.clientTimestamp
        const statement = event?.xapi?.data?.statement
        const extensions = statement?.object?.definition?.extensions
        const localId =
          extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
        const subContentId =
          extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

        const contentId = `${localId}` //|${subContentId}`
        const contentTypeCategories =
          statement?.context?.contextActivities?.category

        const categoryId =
          contentTypeCategories instanceof Array && contentTypeCategories[0]?.id

        let contentType: string | undefined
        if (categoryId) {
          const regex = new RegExp(
            `^http://h5p.org/libraries/H5P.(.+)-\\d+.\\d+$`,
          )
          const results = regex.exec(categoryId)
          contentType = (results && results[1]) || undefined
        }

        const id = `${roomId}|${userId}|${contentId}|${subContentId}`
        let userContentScore = userContentScores.get(id)
        if (!userContentScore) {
          userContentScore = UserContentScore.new(
            roomId,
            userId,
            contentId,
            contentType,
          )
          userContentScores.set(id, userContentScore)
        }

        userContentScore.seen = true
        const min = statement?.result?.score?.min
        if (min !== undefined) {
          userContentScore.min = min
        }
        const max = statement?.result?.score?.max
        if (max !== undefined) {
          userContentScore.max = max
        }

        const response = statement?.result?.response
        const score = statement?.result?.score?.raw
        if (
          (score !== undefined || response !== undefined) &&
          clientTimestamp !== undefined
        ) {
          console.log(JSON.stringify({ id, response, score }))
          const answer = Answer.new(
            userContentScore,
            new Date(clientTimestamp),
            response,
            score,
            min,
            max,
          )
          userContentScore.addAnswer(answer)
        }
      } catch (e) {
        console.error(`Unable to process event: ${e}`)
      }
    }
  }
}
