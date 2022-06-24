import { getRepository } from 'typeorm'
import { UserContentScore, Answer } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class AnswerBuilder {
  private userContentScore: UserContentScore
  private date = new Date()
  private score?: { min: number; max: number; raw: number }
  private response?: string

  constructor(userContentScore: UserContentScore) {
    this.userContentScore = userContentScore
  }

  public withDate(value: Date): this {
    this.date = value
    return this
  }

  public withScore(value?: { min: number; max: number; raw: number }): this {
    this.score = value
    return this
  }

  public withResponse(value?: string): this {
    this.response = value
    return this
  }

  public build(): Answer {
    const entity = Answer.new(
      this.userContentScore,
      this.date.getTime(),
      this.response,
      this.score?.raw,
      this.score?.min,
      this.score?.max,
    )
    return entity
  }

  public async buildAndPersist(): Promise<Answer> {
    const entity = this.build()
    return await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME).save(entity)
  }
}
