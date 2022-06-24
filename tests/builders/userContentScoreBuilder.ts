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
  private contentParentId?: string | null
  private seen = false
  private h5pId?: string
  private h5pSubId?: string

  public withroomId(value: string): this {
    this.roomId = value
    return this
  }

  public withStudentId(value: string): this {
    this.studentId = value
    return this
  }

  public withContentKey(value?: string): this {
    if (!value) throw new Error('contentKey cannot be undefined')
    this.contentKey = value
    return this
  }

  public withContentType(value?: string): this {
    this.contentType = value
    return this
  }

  public withContentName(value?: string): this {
    this.contentName = value
    return this
  }

  public withContentParentId(value?: string | null): this {
    this.contentParentId = value
    return this
  }

  public withSeen(value: boolean): this {
    this.seen = value
    return this
  }

  public withH5pId(value?: string): this {
    this.h5pId = value
    return this
  }

  public withH5pSubId(value?: string): this {
    this.h5pSubId = value
    return this
  }

  public build(): UserContentScore {
    const entity = UserContentScore.new(
      this.roomId,
      this.studentId,
      this.contentKey,
    )
    entity.contentType = this.contentType
    entity.contentName = this.contentName
    entity.contentParentId = this.contentParentId
    entity.seen = this.seen
    entity.h5pId = this.h5pId
    entity.h5pSubId = this.h5pSubId
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
