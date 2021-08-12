import { Service } from 'typedi'
import { UserContentScore } from '../db/assessments/entities'
import { MultipleHotspotUserContentScore } from '../db/assessments/entities/multipleHotspotUserContentScore'

@Service()
export class UserContentScoreFactory {
  public create(
    roomId: string,
    studentId: string,
    contentKey: string,
    contentType?: string,
    contentName?: string,
    contentParentId?: string,
  ): UserContentScore {
    switch (contentType) {
      case 'ImageMultipleHotspotQuestion': {
        const result = new MultipleHotspotUserContentScore(
          roomId,
          studentId,
          contentKey,
        )
        result.contentType = contentType
        result.contentName = contentName
        result.contentParentId = contentParentId
        return result
      }
      default:
        return UserContentScore.new(
          roomId,
          studentId,
          contentKey,
          contentType,
          contentName,
          contentParentId,
        )
    }
  }
}
