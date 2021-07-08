import path from 'path'
import { ConnectionOptions, createConnection } from 'typeorm'
import { Logger } from '../../helpers/logger'

export const CMS_CONNECTION_NAME = 'cms'

export function getCmsDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    name: CMS_CONNECTION_NAME,
    type: 'mysql',
    url,
    synchronize: false,
    entities: [
      path.join(__dirname, './entities/*.ts'),
      path.join(__dirname, './entities/*.js'),
    ],
    extra: {
      connectionLimit: 3,
    },
  }
}

export async function connectToCmsDatabase(url: string): Promise<void> {
  try {
    await createConnection(getCmsDatabaseConnectionOptions(url))
    Logger.get().info('🐬 Connected to mysql: CMS database')
  } catch (e) {
    Logger.get().error('❌ Failed to connect or initialize mysql: CMS database')
    throw e
  }
}
