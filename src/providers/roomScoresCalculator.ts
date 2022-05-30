import { Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { UserContentScore } from '../db/assessments/entities'
import { RoomMaterialsProvider } from './roomMaterialsProvider'
import { RoomScoresTemplateProvider } from './roomScoresTemplateProvider'

const logger = withLogger('RoomScoresCalculator')

@Service()
export class RoomScoresCalculator {
  constructor(
    private readonly roomMaterialsProvider: RoomMaterialsProvider,
    private readonly roomScoresTemplateProvider: RoomScoresTemplateProvider,
  ) {}

  public async calculate(
    roomId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<UserContentScore>> {
    logger.debug(`calculate >> roomId: ${roomId}`)
    const studentContentsResult = await this.roomMaterialsProvider.getMaterials(
      roomId,
      authenticationToken,
    )
    logger.debug(
      `calculate >> roomId: ${roomId} >> materials found: ${studentContentsResult.contents.size}`,
    )
    const mapKeyToUserContentScoreMap =
      await this.roomScoresTemplateProvider.getTemplate(
        roomId,
        studentContentsResult,
      )
    const userContentScores = [...mapKeyToUserContentScoreMap.values()]
    logger.debug(
      `calculate >> roomId: ${roomId} >> userContentScores calculated: ${userContentScores.length}`,
    )

    return userContentScores
  }
}
