import { getRepository } from 'typeorm'
import { UserContentScore, Answer } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class AnswerBuilder {
  private userContentScore: UserContentScore
  private date = new Date()

  constructor(userContentScore: UserContentScore) {
    this.userContentScore = userContentScore
  }

  public withDate(value: Date): this {
    this.date = value
    return this
  }

  public build(): Answer {
    const entity = Answer.new(this.userContentScore, this.date)
    return entity
  }

  public async buildAndPersist(): Promise<Answer> {
    const entity = this.build()
    return await getRepository(Answer, ASSESSMENTS_CONNECTION_NAME).save(entity)
  }
}
