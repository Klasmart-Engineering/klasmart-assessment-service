import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { UserContentScore } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class UserContentScoreBuilder {
  private roomId = v4()
  private studentId = v4()
  private contentKey = v4()
  private contentType?: string
  private contentName?: string

  public withroomId(value: string): this {
    this.roomId = value
    return this
  }

  public withStudentId(value: string): this {
    this.studentId = value
    return this
  }

  public withContentKey(value: string): this {
    this.contentKey = value
    return this
  }

  public withContentType(value: string): this {
    this.contentType = value
    return this
  }

  public withContentName(value: string): this {
    this.contentName = value
    return this
  }

  public build(): UserContentScore {
    const entity = UserContentScore.new(
      this.roomId,
      this.studentId,
      this.contentKey,
      this.contentType,
      this.contentName,
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
