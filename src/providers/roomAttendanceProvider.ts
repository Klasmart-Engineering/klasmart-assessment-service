import { withLogger } from 'kidsloop-nodejs-logger'
import { Inject, Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { ATTENDANCE_CONNECTION_NAME } from '../db/attendance/connectToAttendanceDatabase'
import { Attendance as AttendanceSql } from '../db/attendance/entities'
import { getConfig } from '../initialization/configuration'
import { AttendanceApi, Attendance } from '../web/attendance'

const logger = withLogger('AttendanceProvider')

export interface RoomAttendanceProvider {
  getAttendances(roomId: string): Promise<ReadonlyArray<Attendance>>
  getUserIds(attendances: ReadonlyArray<Attendance>): Set<string>
}

class BaseRoomAttendanceProvider {
  public readonly configuration = getConfig()

  protected handleDuplicateSessionsWithDifferentTimestamps(
    attendances: ReadonlyArray<Attendance>,
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

@Service()
export class RoomAttendanceApiProvider
  extends BaseRoomAttendanceProvider
  implements RoomAttendanceProvider
{
  public constructor(
    @Inject('AttendanceApi') private readonly attendanceApi: AttendanceApi,
  ) {
    super()
  }

  public async getAttendances(roomId: string): Promise<Attendance[]> {
    logger.debug(`getAttendances >> roomId ${roomId}`)

    let attendances = await this.attendanceApi.getRoomAttendances(roomId)
    attendances =
      this.handleDuplicateSessionsWithDifferentTimestamps(attendances)

    logger.debug(
      `getAttendances >> roomId ${roomId}, deduplicated attendances ` +
        `count: ${attendances.length}`,
    )
    return [...attendances.values()]
  }
}

@Service()
export class RoomAttendanceDbProvider
  extends BaseRoomAttendanceProvider
  implements RoomAttendanceProvider
{
  public constructor(
    @InjectRepository(AttendanceSql, ATTENDANCE_CONNECTION_NAME)
    private readonly attendanceRepository: Repository<AttendanceSql>,
  ) {
    super()
  }

  public async getAttendances(roomId: string): Promise<Attendance[]> {
    logger.debug(`getAttendances >> roomId ${roomId}`)

    let attendances = (await this.attendanceRepository.find({
      where: { roomId },
    })) as Attendance[]
    attendances =
      this.handleDuplicateSessionsWithDifferentTimestamps(attendances)

    logger.debug(
      `getAttendances >> roomId ${roomId}, deduplicated attendances ` +
        `count: ${attendances.length}`,
    )
    return [...attendances.values()]
  }
}
