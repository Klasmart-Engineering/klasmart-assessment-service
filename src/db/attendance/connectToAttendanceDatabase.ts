import path from 'path'
import { ConnectionOptions, createConnection } from 'typeorm'
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

export async function connectToAttendanceDatabase(url: string): Promise<void> {
  try {
    await createConnection(getAttendanceDatabaseConnectionOptions(url))
    Logger.get().info('🐘 Connected to postgres: User database')
  } catch (e) {
    Logger.get().error(
      '❌ Failed to connect or initialize postgres: User database',
    )
    throw e
  }
}
