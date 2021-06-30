import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { UserContentScore } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class UserContentScoreBuilder {
  private roomId = v4()
  private studentId = v4()
  private contentId = v4()
  private contentType?: string

  public withroomId(value: string): this {
    this.roomId = value
    return this
  }

  public withStudentId(value: string): this {
    this.studentId = value
    return this
  }

  public withContentId(value: string): this {
    this.contentId = value
    return this
  }

  public build(): UserContentScore {
    const entity = UserContentScore.new(
      this.roomId,
      this.studentId,
      this.contentId,
      this.contentType,
    )
    return entity
  }

  public async buildAndPersist(): Promise<UserContentScore> {
    const entity = this.build()
    return await getRepository(
      UserContentScore,
      ASSESSMENTS_CONNECTION_NAME,
    ).save(entity)
  }
}
