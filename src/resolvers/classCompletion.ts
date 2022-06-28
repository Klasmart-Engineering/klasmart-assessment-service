import { Arg, Query, Resolver, Authorized, Float } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Room, UserContentScore } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { FileType } from '../db/cms/enums'

const logger = withLogger('ClassCompletionResolver')

@Service()
@Resolver()
export default class ClassCompletion {
  constructor(
    @InjectRepository(Room, ASSESSMENTS_CONNECTION_NAME)
    private readonly roomRepo: Repository<Room>,
  ) {}

  @Authorized()
  @Query(() => [Float])
  public async completionPercentages(
    @Arg('room_ids', () => [String]) roomIds: string[],
  ): Promise<number[]> {
    try {
      if (roomIds.length === 0) {
        return []
      }
      const rooms = await this.roomRepo.findByIds(roomIds, {
        select: ['roomId'],
      })
      const roomIdToPercentageMap = new Map<string, number>()
      for (const room of rooms) {
        const percentage = await this.calculatePercentage(room)
        roomIdToPercentageMap.set(room.roomId, percentage)
      }
      return roomIds.map((x) => roomIdToPercentageMap.get(x) ?? 0.0)
    } catch (e) {
      logger.error(
        `[completionPercentages] Calculations failed for rooms ${roomIds}`,
        e,
      )
      throw e
    }
  }

  private async calculatePercentage(room: Room): Promise<number> {
    const userContentScores = await room.scores
    const h5pUserContentScores = userContentScores.filter(this.isH5pContent)
    const totalContents = h5pUserContentScores.length
    if (totalContents === 0) {
      return 0.0
    }
    const totalViewedContents = h5pUserContentScores.filter(
      (x) => x.seen,
    ).length
    const str = (totalViewedContents / totalContents).toFixed(2)
    return Number(str)
  }

  private isH5pContent(ucs: UserContentScore) {
    // The h5pId and h5pSubId columns were added later, so unfortunately we
    // can't use those to determine if a given UserContentScore is H5P or not.
    // The contentType column is only useful for H5P types, which is why we
    // utilize that fact. There's also a legacy mistake that we take advantage of:
    // For non-H5P contents the contentType column sometimes contains the FileType
    // enum *numeric* value.
    return (
      ucs.contentType &&
      !Object.values(FileType)
        .filter((v) => !isNaN(Number(v)))
        .includes(ucs.contentType)
    )
  }
}
