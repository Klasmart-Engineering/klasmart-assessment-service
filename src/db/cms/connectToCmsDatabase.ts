import path from 'path'
import { createConnection } from 'typeorm'

export async function connectToCmsDatabase(): Promise<void> {
  const url = process.env.CMS_DATABASE_URL
  if (!url) {
    throw Error('Please specify a value for CMS_DATABASE_URL')
  }

  try {
    await createConnection({
      name: 'cms',
      type: 'mysql',
      url,
      synchronize: false,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
    })
    console.log('🐬 Connected to mysql: CMS database')
  } catch (e) {
    console.log('❌ Failed to connect or initialize mysql: CMS database')
    throw e
  }
}
