import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'

import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
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
  private roomIdToContentKeyUsesContentIdMap = new Map<string, boolean>()

  constructor(
    @InjectRepository(UserContentScore, ASSESSMENTS_CONNECTION_NAME)
    private readonly userContentScoreRepository: Repository<UserContentScore>,
  ) {}

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
    const contentKey = await this.getCompatContentKey(
      roomId,
      userId,
      material.contentId,
      material.h5pId,
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

  /**
   * The content_id database column has been inconsistent in terms of how it's constructed.
   * There have been two variations but luckily the format has always been the same:
   * `${rootId}` if not a subcontent, otherwise `${rootId}|${subContentId}`
   * One variation uses the CMS content ID as rootId. The other uses the H5P id as rootId.
   * In v2 of this service (the event-driven architecture), H5P ID takes precedence.
   * So this method will only use the CMS content ID if
   * 1) The content is a non-H5P lesson material.
   * 2) The target room already contains database entries using the CMS content ID.
   */
  public async getCompatContentKey(
    roomId: string,
    studentId: string,
    contentId: string,
    h5pId: string | undefined,
    h5pSubId: string | undefined,
  ): Promise<string> {
    if (!h5pId) {
      return ContentKey.construct(contentId, h5pSubId)
    }
    let contentKey = ContentKey.construct(contentId, h5pSubId)
    const contentKeyUsesContentId =
      this.roomIdToContentKeyUsesContentIdMap.get(roomId)
    if (contentKeyUsesContentId === true) {
      return contentKey
    } else if (contentKeyUsesContentId === false) {
      return ContentKey.construct(h5pId, h5pSubId)
    }

    const userContentScoreUsingContentId =
      (await this.userContentScoreRepository.manager.query(
        `SELECT EXISTS(SELECT * FROM assessment_xapi_user_content_score WHERE room_id = $1 AND student_id = $2 AND content_id = $3)`,
        [roomId, studentId, contentKey],
      )) as [{ exists: boolean }]

    if (userContentScoreUsingContentId[0].exists === true) {
      this.roomIdToContentKeyUsesContentIdMap.set(roomId, true)
    } else {
      this.roomIdToContentKeyUsesContentIdMap.set(roomId, false)
      contentKey = ContentKey.construct(h5pId, h5pSubId)
    }
    return contentKey
  }
}
