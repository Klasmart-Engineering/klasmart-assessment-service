import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import {
  TeacherScore,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class TeacherScoreBuilder {
  private userContentScore: UserContentScore
  private teacherId = v4()
  private score = 1

  constructor(userContentScore: UserContentScore) {
    this.userContentScore = userContentScore
  }

  public withTeacherId(value: string): this {
    this.teacherId = value
    return this
  }

  public withScore(value: number): this {
    this.score = value
    return this
  }

  public build(): TeacherScore {
    const entity = TeacherScore.new(
      this.userContentScore,
      this.teacherId,
      this.score,
    )
    return entity
  }

  public async buildAndPersist(): Promise<TeacherScore> {
    const entity = this.build()
    return await getRepository(TeacherScore, ASSESSMENTS_CONNECTION_NAME).save(
      entity,
    )
  }
}
