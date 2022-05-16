import { Service } from 'typedi'
import { UserContentScore } from '../db/assessments/entities'
import { ScoreAggregatorUserContentScore } from '../db/assessments/entities/scoreAggregatorUserContentScore'

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
      case 'AdvancedBlanks':
      case 'ImageMultipleHotspotQuestion': {
        const result = new ScoreAggregatorUserContentScore(
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
