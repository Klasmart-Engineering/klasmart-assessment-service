import path from 'path'
import { Connection, ConnectionOptions, createConnection } from 'typeorm'
import { Logger } from '../../helpers/logger'

export const ATTENDANCE_CONNECTION_NAME = 'users'

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
    Logger.get().info('🐘 Connected to postgres: Attendance database')
    return connection
  } catch (e) {
    Logger.get().error(
      '❌ Failed to connect or initialize postgres: Attendance database',
    )
    throw e
  }
}
