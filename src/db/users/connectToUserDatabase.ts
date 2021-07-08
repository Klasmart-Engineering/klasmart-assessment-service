import path from 'path'
import { ConnectionOptions, createConnection } from 'typeorm'
import { Logger } from '../../helpers/logger'

export const USERS_CONNECTION_NAME = 'users'

export function getUserDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    name: USERS_CONNECTION_NAME,
    type: 'postgres',
    url,
    synchronize: false,
    entities: [
      path.join(__dirname, './entities/*.ts'),
      path.join(__dirname, './entities/*.js'),
    ],
  }
}

export async function connectToUserDatabase(url: string): Promise<void> {
  try {
    await createConnection(getUserDatabaseConnectionOptions(url))
    Logger.get().info('🐘 Connected to postgres: User database')
  } catch (e) {
    Logger.get().error(
      '❌ Failed to connect or initialize postgres: User database',
    )
    throw e
  }
}
