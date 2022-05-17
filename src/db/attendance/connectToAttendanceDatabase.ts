import path from 'path'
import { Connection, ConnectionOptions, createConnection } from 'typeorm'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('connectToAttendanceDatabase')

export const ATTENDANCE_CONNECTION_NAME = 'attendance'

export function getAttendanceDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    name: ATTENDANCE_CONNECTION_NAME,
    type: 'postgres',
    url,
    synchronize: false,
    entities: [
      path.join(__dirname, './entities/*.ts'),
      path.join(__dirname, './entities/*.js'),
    ],
  }
}

export async function connectToAttendanceDatabase(
  url: string,
): Promise<Connection> {
  try {
    const connection = await createConnection(
      getAttendanceDatabaseConnectionOptions(url),
    )
    logger.info('🐘 Connected to postgres: Attendance database')
    return connection
  } catch (e) {
    logger.error(
      '❌ Failed to connect or initialize postgres: Attendance database',
    )
    throw e
  }
}
