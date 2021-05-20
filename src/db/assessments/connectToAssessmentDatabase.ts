import path from 'path'
import { createConnection } from 'typeorm'

export async function connectToAssessmentDatabase(): Promise<void> {
  const url = process.env.ASSESSMENT_DATABASE_URL
  if (!url) {
    throw Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }

  try {
    await createConnection({
      name: 'assessments',
      type: 'postgres',
      url,
      synchronize: false,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
    })
    console.log('🐘 Connected to postgres: Assessment database')
  } catch (e) {
    console.log(
      '❌ Failed to connect or initialize postgres: Assessment database',
    )
    throw e
  }
}
