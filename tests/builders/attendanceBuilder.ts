import { v4 } from 'uuid'
import { Attendance } from '../../src/web/attendance'

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
    const joinDate = new Date()
    joinDate.setDate(joinDate.getDate() - 1)
    const leaveDate = new Date(joinDate.getTime() + 5 * 60000)
    const joinTimestamp = this.joinTimestamp ?? joinDate
    const leaveTimestamp = this.leaveTimestamp ?? leaveDate

    const entity: Attendance = {
      sessionId: this.sessionId ?? v4(),
      userId: this.userId ?? v4(),
      roomId: this.roomId ?? v4(),
      joinTimestamp,
      leaveTimestamp,
    }
    return entity
  }
}
