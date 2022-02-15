import { getRepository } from 'typeorm'
import { Room } from '../../src/db/assessments/entities/room'
import { v4 } from 'uuid'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class RoomBuilder {
  private roomId = v4()
  private attendanceCount = 0

  withRoomId(value: string): this {
    this.roomId = value
    return this
  }

  withAttendanceCount(value: number): this {
    this.attendanceCount = value
    return this
  }

  public build(): Room {
    const entity = new Room(this.roomId)
    entity.attendanceCount = this.attendanceCount
    return entity
  }

  public async buildAndPersist(): Promise<Room> {
    const entity = this.build()
    return await getRepository(Room, ASSESSMENTS_CONNECTION_NAME).save(entity)
  }
}
