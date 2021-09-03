import path from 'path'
import { ConnectionOptions, createConnection } from 'typeorm'
import { Logger } from '../../../helpers/logger'

export const XAPI_CONNECTION_NAME = 'xapi'

export function getXApiDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    name: XAPI_CONNECTION_NAME,
    type: 'postgres',
    url,
    synchronize: false,
    entities: [
      path.join(__dirname, './entities/*.ts'),
      path.join(__dirname, './entities/*.js'),
    ],
    logging: Boolean(process.env.ASSESSMENT_DATABASE_LOGGING),
    migrations: ['src/migrations/*.ts'],
    migrationsTableName: 'assessment_xapi_migration',
    migrationsRun: false,
    cli: {
      migrationsDir: 'src/migrations',
    },
  }
}

export async function connectToXApiDatabase(url: string): Promise<void> {
  console.log('attempting connection')
  try {
    await createConnection(getXApiDatabaseConnectionOptions(url))
    Logger.get().info('🐘 Connected to postgres: XApi database')
  } catch (e) {
    Logger.get().error(
      '❌ Failed to connect or initialize postgres: XApi database',
    )
    throw e
  }
}
