import { gql, request } from 'graphql-request'
import { Service } from 'typedi'
import { withCorrelation, withLogger } from 'kidsloop-nodejs-logger'
import { getConfig, Configuration } from '../../initialization/configuration'

const logger = withLogger('connectToUserDatabase')

class AttendanceApiBadResult extends Error {
  constructor(message: string) {
    logger.error(message)
    super(message)
    Object.setPrototypeOf(this, AttendanceApiBadResult.prototype)
  }
}

interface AttendanceResult {
  sessionId: string
  joinTimestamp: string
  leaveTimestamp: string
  roomId?: string
  userId: string
}

export interface Attendance {
  sessionId: string
  roomId?: string
  userId: string
  joinTimestamp: Date
  leaveTimestamp: Date
}

const convertAttendanceResultToTypedClass = (
  result: AttendanceResult,
): Attendance => {
  const sessionId = result.sessionId
  const roomId = result.roomId
  const userId = result.userId
  let joinTimestamp: Date
  let leaveTimestamp: Date
  try {
    const joinTimestampDate = new Date(result.joinTimestamp)
    joinTimestamp = new Date(
      joinTimestampDate.getTime() -
      joinTimestampDate.getTimezoneOffset() * 60000,
    )
  } catch (e) {
    logger.error(e)
    throw new AttendanceApiBadResult(
      'Attendance API result: <joinTimestampDate> bad date format',
    )
  }
  try {
    const leaveTimestampDate = new Date(result.leaveTimestamp)
    leaveTimestamp = new Date(
      leaveTimestampDate.getTime() -
      leaveTimestampDate.getTimezoneOffset() * 60000,
    )
  } catch (e) {
    logger.error(e)
    throw new AttendanceApiBadResult(
      'Attendance API result: <leaveTimestampDate> bad date format',
    )
  }
  return {
    sessionId,
    roomId,
    userId,
    joinTimestamp,
    leaveTimestamp,
  }
}

@Service()
export class AttendanceApi {
  readonly config: Configuration = getConfig()

  getRoomAttendances = async (
    roomId: string,
  ): Promise<ReadonlyArray<Attendance>> => {
    console.log(`Correlation in getRoomAttendances: ${withCorrelation()}`)
    const data: { getClassAttendance: AttendanceResult[] } = await request(
      this.config.ATTENDANCE_SERVICE_ENDPOINT!,
      GET_CLASS_ATTENDANCE_QUERY,
      { roomId },
    )
    const attendances = data.getClassAttendance.map((att) =>
      convertAttendanceResultToTypedClass(att),
    )
    return attendances
  }
}

const GET_CLASS_ATTENDANCE_QUERY = gql`
  query Query($roomId: String!) {
    getClassAttendance(roomId: $roomId) {
      roomId
      userId
      sessionId
      joinTimestamp
      leaveTimestamp
    }
  }
`
