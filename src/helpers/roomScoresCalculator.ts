import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { UserContentScore, Answer } from '../db/assessments/entities'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { Content } from '../db/cms/entities'
import { FileType } from '../db/cms/enums'
import { Attendance } from '../db/users/entities'
import { XAPIRepository, XAPIRecord } from '../db/xapi/repo'

@Service()
export class RoomScoresCalculator {
  constructor(
    private readonly xapiRepository: XAPIRepository,
    @InjectRepository(Content, CMS_CONNECTION_NAME)
    private readonly contentRepository: Repository<Content>,
  ) {}

  public async calculate(
    roomId: string,
    attendances: Attendance[],
    materialIds: string[],
  ): Promise<UserContentScore[]> {
    const userContentScores = new Map<string, UserContentScore>()
    const attendanceMap = new Map<string, Attendance>()

    const materials = await this.contentRepository
      .createQueryBuilder('content')
      .where('content.id IN (:...contentIds)', { contentIds: materialIds })
      .andWhere(`data->"$.file_type" != :fileType`, {
        fileType: FileType.H5P,
      })
      .getMany()

    const seen: { [key: string]: boolean } = {}
    const userIds = attendances
      .filter(function (item) {
        return seen[item.userId] ? false : (seen[item.userId] = true)
      })
      .map((x) => x.userId)

    for (const userId of userIds) {
      for (const material of materials) {
        const id = `${roomId}|${userId}|${material.contentId}`
        userContentScores.set(
          id,
          UserContentScore.new(roomId, userId, material.contentId, undefined),
        )
      }
    }

    // Handle duplicate session ids with different timestamps.
    for (const attendance of attendances) {
      const entry = attendanceMap.get(attendance.sessionId)
      if (!entry) {
        attendanceMap.set(attendance.sessionId, attendance)
      } else {
        if (attendance.joinTimestamp < entry.joinTimestamp) {
          entry.joinTimestamp = attendance.joinTimestamp
        }
        if (attendance.leaveTimestamp > entry.leaveTimestamp) {
          entry.leaveTimestamp = attendance.leaveTimestamp
        }
      }
    }

    for (const {
      userId,
      joinTimestamp,
      leaveTimestamp,
    } of attendanceMap.values()) {
      const xapiEvents = await this.xapiRepository.searchXApiEvents(
        userId,
        joinTimestamp.getTime(),
        leaveTimestamp.getTime(),
      )
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
      try {
        const clientTimestamp = event?.xapi?.clientTimestamp
        const statement = event?.xapi?.data?.statement
        const extensions = statement?.object?.definition?.extensions
        const localId =
          extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
        const subContentId =
          extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

        const contentId = subContentId
          ? `${localId}|${subContentId}`
          : `${localId}`
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

        const id = `${roomId}|${userId}|${contentId}`
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

        const verb = statement?.verb?.display?.['en-US']
        if (
          contentType === 'ImageMultipleHotspotQuestion' &&
          verb === 'attempted'
        ) {
          userContentScore.startMultipleHotspots()
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
