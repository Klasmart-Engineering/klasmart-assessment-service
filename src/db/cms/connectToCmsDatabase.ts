import path from 'path'
import { createConnection } from 'typeorm'

export const CMS_CONNECTION_NAME = 'cms'

export async function connectToCmsDatabase(): Promise<void> {
  const url = process.env.CMS_DATABASE_URL
  if (!url) {
    throw new Error('Please specify a value for CMS_DATABASE_URL')
  }

  try {
    await createConnection({
      name: CMS_CONNECTION_NAME,
      type: 'mysql',
      url,
      synchronize: false,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
      extra: {
        connectionLimit: 20,
      },
    })
    console.log('🐬 Connected to mysql: CMS database')
  } catch (e) {
    console.log('❌ Failed to connect or initialize mysql: CMS database')
    throw e
  }
}
