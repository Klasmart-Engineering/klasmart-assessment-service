import { Service } from 'typedi'
import { UserContentScore } from '../db/assessments/entities'
import { MultipleHotspotUserContentScore } from '../db/assessments/entities/multipleHotspotUserContentScore'

@Service()
export class UserContentScoreFactory {
  public create(
    roomId: string,
    studentId: string,
    contentKey: string,
    activityType?: string,
    activityName?: string,
  ): UserContentScore {
    switch (activityType) {
      case 'ImageMultipleHotspotQuestion': {
        const result = new MultipleHotspotUserContentScore(
          roomId,
          studentId,
          contentKey,
        )
        result.contentType = activityType
        result.contentName = activityName
        return result
      }
      default:
        return UserContentScore.new(
          roomId,
          studentId,
          contentKey,
          activityType,
          activityName,
        )
    }
  }
}
