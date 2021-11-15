import path from 'path'
import { ConnectionOptions, createConnection } from 'typeorm'
import { Logger } from '../../helpers/logger'

export const ASSESSMENTS_CONNECTION_NAME = 'assessments'

export function getAssessmentDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    name: ASSESSMENTS_CONNECTION_NAME,
    type: 'postgres',
    url,
    synchronize: true,
    entities: [
      path.join(__dirname, './entities/*.ts'),
      path.join(__dirname, './entities/*.js'),
    ],
    logging: Boolean(process.env.ASSESSMENT_DATABASE_LOGGING),
    migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
    migrationsTableName: 'assessment_xapi_migration',
    migrationsRun: false,
    cli: {
      migrationsDir: 'src/migrations',
    },
  }
}

export async function connectToAssessmentDatabase(url: string): Promise<void> {
  try {
    await createConnection(getAssessmentDatabaseConnectionOptions(url))
    Logger.get().info('🐘 Connected to postgres: Assessment database')
  } catch (e) {
    Logger.get().error(
      '❌ Failed to connect or initialize postgres: Assessment database',
    )
    throw e
  }
}
