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
      .getMany()

    const h5pIdToContentIdMap = new Map<string, string>()
    for (const x of materials) {
      if (x.h5pId) {
        h5pIdToContentIdMap.set(x.h5pId, x.contentId)
      }
    }

    const seen: { [key: string]: boolean } = {}
    const userIds = attendances
      .filter(function (item) {
        return seen[item.userId] ? false : (seen[item.userId] = true)
      })
      .map((x) => x.userId)

    for (const userId of userIds) {
      for (const material of materials.filter(
        (x) => x.fileType !== FileType.H5P,
      )) {
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
      await this.applyEventsToUserContentScore(
        roomId,
        userId,
        xapiEvents,
        userContentScores,
        h5pIdToContentIdMap,
      )
    }
    return [...userContentScores.values()]
  }

  private async applyEventsToUserContentScore(
    roomId: string,
    userId: string,
    xapiEvents: XAPIRecord[],
    userContentScores: Map<string, UserContentScore>,
    h5pIdToContentIdMap: Map<string, string>,
  ): Promise<void> {
    for (const event of xapiEvents) {
      if (!event) {
        continue
      }
      try {
        const clientTimestamp = event?.xapi?.clientTimestamp
        const statement = event?.xapi?.data?.statement
        const extensions = statement?.object?.definition?.extensions
        const h5pId =
          extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
        const subcontentId =
          extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

        if (!h5pId) {
          console.log('XAPI event did not include an H5P ID. Skipping...')
          continue
        }
        const contentId = h5pIdToContentIdMap.get(h5pId)
        if (!contentId) {
          console.log(
            `XAPI event was received for H5P ID (${h5pId}), which is not part of the lesson plan. Skipping...`,
          )
          continue
        }

        const fullContentId = subcontentId
          ? `${contentId}|${subcontentId}`
          : `${contentId}`
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

        const contentName = statement?.object?.definition?.name?.['en-US']

        const id = `${roomId}|${userId}|${fullContentId}`
        let userContentScore = userContentScores.get(id)
        if (!userContentScore) {
          userContentScore = UserContentScore.new(
            roomId,
            userId,
            fullContentId,
            contentType,
            contentName,
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
          //console.log(JSON.stringify({ id, response, score }))
          const answer = Answer.new(
            userContentScore,
            new Date(clientTimestamp),
            response,
            score,
            min,
            max,
          )
          await userContentScore.addAnswer(answer)
        }
      } catch (e) {
        console.error(`Unable to process event: ${e}`)
      }
    }
  }
}
