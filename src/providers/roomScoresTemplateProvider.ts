import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'

import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import ContentKey from '../helpers/contentKey'
import { StudentContentsResult } from './cmsContentProvider'
import { UserContentScoreFactory } from './userContentScoreFactory'

const logger = withLogger('RoomScoresTemplateProvider')

/**
 * Creates a list of empty UserContentScores for every user-material combination, including subcontent.
 * For each user, the UserContentScores will be in the order defined in the lesson plan.
 * Subcontents aren't defined in lesson plans so the order of those will be based on event timestamps,
 * but will all be grouped together right after the parent item.
 * The user of this class should populate the generated "template" with actual results.
 */
@Service()
export class RoomScoresTemplateProvider {
  private roomIdToContentKeyUsesH5pIdMap = new Map<string, boolean>()

  constructor(
    @InjectRepository(UserContentScore, ASSESSMENTS_CONNECTION_NAME)
    private readonly userContentScoreRepository: Repository<UserContentScore>,
    private readonly userContentScoreFactory: UserContentScoreFactory,
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

    // Populate mapKeyToUserContentScoreMap with an empty UserContentScore for every user-material combination.
    // const emptySet = new Set<string>()
    for (const student of studentContentsResult.studentContentMap) {
      // First the root activity.
      for (const contentId of student.contentIds) {
        const material = studentContentsResult.contents.get(contentId)
        if (!material) {
          throw new Error(
            'getTemplate >> student contentId not included in content list. ' +
              `student contentId: ${contentId}`,
          )
        }
        await this.addUserContentScoreToMap(
          roomId,
          student.studentId,
          material,
          undefined,
          mapKeyToUserContentScoreMap,
        )
      }
    }
    return mapKeyToUserContentScoreMap
  }

  private async addUserContentScoreToMap(
    roomId: string,
    userId: string,
    material: Content,
    subcontentId: string | undefined,
    mapKeyToUserContentScoreMap: Map<string, UserContentScore>,
  ) {
    // TODO: Replace the call to getCompatContentKey with the commented out line, below, after the content_id migration.
    //const contentKey = ContentKey.construct(material.contentId)
    const contentKey = await this.getCompatContentKey(
      roomId,
      userId,
      material.contentId,
      material.h5pId,
      subcontentId,
    )
    const mapKey = RoomScoresTemplateProvider.getMapKey(
      roomId,
      userId,
      contentKey,
    )
    let h5pType: string | undefined
    let h5pName: string | undefined
    let h5pParentId: string | undefined
    if (material.h5pId) {
      if (subcontentId != null && h5pParentId == null) {
        // subcontent.parentId is always non-null if the parent is another subcontent.
        // In this case, h5pParentId is null so the parent must be the root h5p id.
        h5pParentId = material.h5pId
      }
    }
    mapKeyToUserContentScoreMap.set(
      mapKey,
      this.userContentScoreFactory.create(
        roomId,
        userId,
        contentKey,
        h5pType,
        h5pName,
        h5pParentId,
      ),
    )
  }

  // TODO: Delete this method after the content_id migration.
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
    let contentKey = ContentKey.construct(h5pId, h5pSubId)
    const contentKeyUsesH5pId = this.roomIdToContentKeyUsesH5pIdMap.get(roomId)
    if (contentKeyUsesH5pId === true) {
      return contentKey
    } else if (contentKeyUsesH5pId === false) {
      return ContentKey.construct(contentId, h5pSubId)
    }
    // If we find a content_id entry that's still using the h5pId, it means we haven't
    // run the migration script yet. So keep using the h5pId, for now.
    const userContentScoreUsingH5pId =
      (await this.userContentScoreRepository.manager.query(
        `SELECT EXISTS(SELECT * FROM assessment_xapi_user_content_score WHERE room_id = $1 AND student_id = $2 AND content_id = $3)`,
        [roomId, studentId, contentKey],
      )) as [{ exists: boolean }]

    if (userContentScoreUsingH5pId[0].exists === true) {
      this.roomIdToContentKeyUsesH5pIdMap.set(roomId, true)
    } else {
      this.roomIdToContentKeyUsesH5pIdMap.set(roomId, false)
      contentKey = ContentKey.construct(contentId, h5pSubId)
    }
    return contentKey
  }
}
