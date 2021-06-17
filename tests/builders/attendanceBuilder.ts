import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { Attendance } from '../../src/db/users/entities/attendance'
import { USERS_CONNECTION_NAME } from '../../src/db/users/connectToUserDatabase'
import { Mutable } from '../utils/mutable'

export default class AttendanceBuilder {
  private sessionId?: string
  private userId?: string
  private roomId?: string
  private joinTimestamp?: Date
  private leaveTimestamp?: Date

  public withSessionId(value: string): this {
    this.sessionId = value
    return this
  }

  public withUserId(value: string): this {
    this.userId = value
    return this
  }

  public withroomId(value: string): this {
    this.roomId = value
    return this
  }

  public withPeriod(join: Date, leave: Date): this {
    this.joinTimestamp = join
    this.leaveTimestamp = leave
    return this
  }

  public build(): Attendance {
    const entity = new Attendance()
    const mutableEntity: Mutable<Attendance> = entity
    mutableEntity.sessionId = this.sessionId ?? v4()
    mutableEntity.userId = this.userId ?? v4()
    mutableEntity.roomId = this.roomId ?? v4()
    this.assignPeriod(entity)
    return entity
  }

  public async buildAndPersist(): Promise<Attendance> {
    const entity = this.build()
    return await getRepository(Attendance, USERS_CONNECTION_NAME).save(entity)
  }

  private assignPeriod(entity: Attendance) {
    const joinDate = new Date()
    joinDate.setDate(joinDate.getDate() - 1)
    const leaveDate = new Date(joinDate.getTime() + 5 * 60000)
    entity.joinTimestamp = this.joinTimestamp ?? joinDate
    entity.leaveTimestamp = this.leaveTimestamp ?? leaveDate
  }
}
