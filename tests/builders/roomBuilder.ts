import { getRepository } from 'typeorm'
import { Room } from '../../src/db/assessments/entities/room'
import { v4 } from 'uuid'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'
import { UserContentScore } from '../../src/db/assessments/entities'

export default class RoomBuilder {
  private roomId = v4()
  private userContentScores?: UserContentScore[]
  private assessmentVersion = 2

  withRoomId(value: string): this {
    this.roomId = value
    return this
  }

  withUcs(value: UserContentScore[]): this {
    this.userContentScores = value
    return this
  }

  withAssessmentVersion(value: number): this {
    this.assessmentVersion = value
    return this
  }

  public build(): Room {
    const entity = new Room(this.roomId)
    entity.assessmentVersion = this.assessmentVersion
    if (this.userContentScores) {
      entity.scores = Promise.resolve(this.userContentScores)
    }
    return entity
  }

  public async buildAndPersist(): Promise<Room> {
    const entity = this.build()
    return await getRepository(Room, ASSESSMENTS_CONNECTION_NAME).save(entity)
  }
}
