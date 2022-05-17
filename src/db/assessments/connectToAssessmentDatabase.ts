import path from 'path'
import { ConnectionOptions, createConnection } from 'typeorm'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('connectToAssessmentDatabase')

export const ASSESSMENTS_CONNECTION_NAME = 'assessments'

export function getAssessmentDatabaseConnectionOptions(
  url: string,
): ConnectionOptions {
  return {
    name: ASSESSMENTS_CONNECTION_NAME,
    type: 'postgres',
    url,
    synchronize: false,
    entities: [
      path.join(__dirname, './entities/*.ts'),
      path.join(__dirname, './entities/*.js'),
    ],
    logging: Boolean(process.env.ASSESSMENT_DATABASE_LOGGING),
    migrations: [path.join(__dirname, '../../migrations/*.{ts,js}')],
    migrationsTableName: 'assessment_xapi_migration',
    migrationsRun: true,
    cli: {
      migrationsDir: 'src/migrations',
    },
  }
}

export async function connectToAssessmentDatabase(url: string): Promise<void> {
  try {
    await createConnection(getAssessmentDatabaseConnectionOptions(url))
    logger.info('🐘 Connected to postgres: Assessment database')
  } catch (e) {
    logger.error(
      '❌ Failed to connect or initialize postgres: Assessment database',
    )
    throw e
  }
}
