import { getRepository } from 'typeorm'
import { Answer, RawAnswer } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import { v4 } from 'uuid'

export default class RawAnswerBuilder {
  private roomId = v4()
  private studentId = v4()
  private h5pId = v4()
  private h5pSubId?: string
  private timestamp = Date.now()
  private score?: number
  private response?: string
  private minimumPossibleScore?: number
  private maximumPossibleScore?: number

  public withRoomId(value: string): this {
    this.roomId = value
    return this
  }

  public withStudentId(value: string): this {
    this.studentId = value
    return this
  }

  public withH5pId(value: string): this {
    this.h5pId = value
    return this
  }

  public withH5pSubId(value?: string): this {
    this.h5pSubId = value
    return this
  }

  public withTimestamp(value: number): this {
    this.timestamp = value
    return this
  }

  public withScore(value?: number): this {
    this.score = value
    return this
  }

  public withResponse(value?: string): this {
    this.response = value
    return this
  }

  public withMinimumPossibleScore(value?: number): this {
    this.minimumPossibleScore = value
    return this
  }

  public withMaximumPossibleScore(value?: number): this {
    this.maximumPossibleScore = value
    return this
  }

  public build(): RawAnswer {
    return getRepository(RawAnswer, ASSESSMENTS_CONNECTION_NAME).create({
      roomId: this.roomId,
      studentId: this.studentId,
      h5pId: this.h5pId,
      h5pSubId: this.h5pSubId,
      timestamp: this.timestamp,
      answer: this.response,
      score: this.score,
      minimumPossibleScore: this.minimumPossibleScore,
      maximumPossibleScore: this.maximumPossibleScore,
    })
  }

  public async buildAndPersist(): Promise<RawAnswer> {
    const entity = this.build()
    return await getRepository(RawAnswer, ASSESSMENTS_CONNECTION_NAME).save(
      entity,
    )
  }
}
