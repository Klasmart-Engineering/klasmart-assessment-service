import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { Attendance } from '../db/users/entities'
import ContentKey from './contentKey'
import { RoomAttendanceProvider } from './roomAttendanceProvider'
import { ParsedXapiEvent } from './parsedXapiEvent'
import { UserContentScoreFactory } from './userContentScoreFactory'

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
    private readonly roomAttendanceProvider: RoomAttendanceProvider,
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
    teacherId: string,
    materials: Content[],
    attendances: Attendance[],
    xapiEvents: ParsedXapiEvent[],
  ): Promise<Map<string, UserContentScore>> {
    const mapKeyToUserContentScoreMap = new Map<string, UserContentScore>()
    const userIds = this.roomAttendanceProvider.getUserIds(attendances)

    // Won't be necessary when a subcontent API is implemented.
    const h5pKeyToXapiEventMap = new Map<string, ParsedXapiEvent>()
    const h5pIdToSubIdsMap = new Map<string, Set<string>>()
    for (const x of xapiEvents) {
      const h5pKey = ContentKey.construct(x.h5pId, x.h5pSubId)
      h5pKeyToXapiEventMap.set(h5pKey, x)
      if (!x.h5pSubId) continue
      const subIds = h5pIdToSubIdsMap.get(x.h5pId) ?? new Set<string>()
      h5pIdToSubIdsMap.set(x.h5pId, subIds)
      subIds.add(x.h5pSubId)
      // Originally, sub-activities only generated a UserContentScore if an xAPI was received for it.
      // Because without a subcontent API, we can't know about it.
      // But now we use the fact that an xAPI event will include a parent ID if the activity
      // that generated the event is a sub-activity. So we now use that parent ID to generate a
      // UserContentScore for that parent, even though the parent may not emit an event.
      if (x.h5pParentId && x.h5pParentId !== x.h5pId) {
        subIds.add(x.h5pParentId)
      }
    }

    // Populate mapKeyToUserContentScoreMap with an empty UserContentScore for every user-material combination.
    const emptySet = new Set<string>()
    for (const userId of userIds) {
      if (userId === teacherId) {
        continue
      }
      // First the root activity.
      for (const material of materials) {
        await this.addUserContentScoreToMap(
          roomId,
          userId,
          material,
          undefined,
          h5pKeyToXapiEventMap,
          mapKeyToUserContentScoreMap,
        )
        // Only H5P content can have subcontent.
        if (!material.h5pId) {
          continue
        }
        // Now loop through all the subcontents.
        const subcontentIds = h5pIdToSubIdsMap.get(material.h5pId) || emptySet
        for (const subcontentId of subcontentIds) {
          await this.addUserContentScoreToMap(
            roomId,
            userId,
            material,
            subcontentId,
            h5pKeyToXapiEventMap,
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
    subcontentId: string | undefined,
    h5pKeyToXapiEventMap: Map<string, ParsedXapiEvent>,
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
      const h5pKey = ContentKey.construct(material.h5pId, subcontentId)
      h5pType = h5pKeyToXapiEventMap.get(h5pKey)?.h5pType
      h5pName = h5pKeyToXapiEventMap.get(h5pKey)?.h5pName
      h5pParentId = h5pKeyToXapiEventMap.get(h5pKey)?.h5pParentId
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
