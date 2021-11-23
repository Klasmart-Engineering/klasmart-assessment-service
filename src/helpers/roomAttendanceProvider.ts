import { Inject, Service } from 'typedi'
import { AttendanceApi, Attendance } from '../api'

@Service()
export class RoomAttendanceProvider {
  public constructor(private readonly attendanceApi: AttendanceApi) {}

  public async getAttendances(roomId: string): Promise<Attendance[]> {
    let attendances = await this.attendanceApi.getRoomAttendances(roomId)
    attendances =
      this.handleDuplicateSessionsWithDifferentTimestamps(attendances)

    return [...attendances.values()]
  }

  private handleDuplicateSessionsWithDifferentTimestamps(
    attendances: Attendance[],
  ): Attendance[] {
    const sessionIdToAttendanceMap = new Map<string, Attendance>()

    for (const attendance of attendances) {
      const entry = sessionIdToAttendanceMap.get(attendance.sessionId)
      if (!entry) {
        sessionIdToAttendanceMap.set(attendance.sessionId, attendance)
      } else {
        if (attendance.joinTimestamp < entry.joinTimestamp) {
          entry.joinTimestamp = attendance.joinTimestamp
        }
        if (attendance.leaveTimestamp > entry.leaveTimestamp) {
          entry.leaveTimestamp = attendance.leaveTimestamp
        }
      }
    }
    return [...sessionIdToAttendanceMap.values()]
  }

  public getUserIds(attendances: Attendance[]): Set<string> {
    return new Set(attendances.map((x) => x.userId))
  }
}
