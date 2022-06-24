import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'

import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import ContentKey from '../helpers/contentKey'
import { StudentContentsResult } from './cmsContentProvider'

const logger = withLogger('RoomScoresTemplateProvider')

/**
 * Creates a list of empty UserContentScores for every user-material combination, including subcontent.
 * For each user, the UserContentScores will be in the order defined in the lesson plan.
 * The user of this class should populate the generated "template" with actual results.
 */
@Service()
export class RoomScoresTemplateProvider {
  public static getMapKey(
    roomId: string,
    userId: string,
    contentKey: string,
  ): string {
    return `${roomId}|${userId}|${contentKey}`
  }

  public async getTemplate(
    roomId: string,
    studentContentsResult: StudentContentsResult,
  ): Promise<ReadonlyMap<string, UserContentScore>> {
    const mapKeyToUserContentScoreMap = new Map<string, UserContentScore>()

    for (const student of studentContentsResult.studentContentMap) {
      for (const contentId of student.contentIds) {
        const material = studentContentsResult.contents.get(contentId)
        if (!material) {
          logger.error(
            'getTemplate >> contentId not included in CMS provided content list.',
            { roomId, studentId: student.studentId, contentId },
          )
          continue
        }
        await this.addUserContentScoreToMap(
          roomId,
          student.studentId,
          material.content,
          mapKeyToUserContentScoreMap,
        )
        for (const subContent of material.subContents) {
          await this.addUserContentScoreToMap(
            roomId,
            student.studentId,
            subContent,
            mapKeyToUserContentScoreMap,
          )
        }
      }
    }
    return mapKeyToUserContentScoreMap
  }

  private async addUserContentScoreToMap(
    roomId: string,
    userId: string,
    material: Content,
    mapKeyToUserContentScoreMap: Map<string, UserContentScore>,
  ) {
    const contentKey = ContentKey.construct(
      material.contentId,
      material.subcontentId,
    )
    const mapKey = RoomScoresTemplateProvider.getMapKey(
      roomId,
      userId,
      contentKey,
    )
    mapKeyToUserContentScoreMap.set(
      mapKey,
      UserContentScore.new(roomId, userId, contentKey, material),
    )
  }
}
