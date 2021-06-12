import path from 'path'
import { createConnection } from 'typeorm'

export const ASSESSMENTS_CONNECTION_NAME = 'assessments'

export async function connectToAssessmentDatabase(): Promise<void> {
  const url = process.env.ASSESSMENT_DATABASE_URL
  if (!url) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }

  try {
    await createConnection({
      name: ASSESSMENTS_CONNECTION_NAME,
      type: 'postgres',
      url,
      synchronize: true,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
      logging: Boolean(process.env.ASSESSMENT_DATABASE_LOGGING),
    })
    console.log('🐘 Connected to postgres: Assessment database')
  } catch (e) {
    console.log(
      '❌ Failed to connect or initialize postgres: Assessment database',
    )
    throw e
  }
}
