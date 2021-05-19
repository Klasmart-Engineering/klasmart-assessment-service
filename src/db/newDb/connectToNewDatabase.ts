import path from 'path'
import { createConnection } from 'typeorm'

export async function connectToNewDatabase(): Promise<void> {
  const url = process.env.NEW_DATABASE_URL
  if (!url) {
    throw Error('Please specify a value for NEW_DATABASE_URL')
  }

  try {
    await createConnection({
      name: 'new',
      type: 'postgres',
      url,
      synchronize: false,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
    })
    console.log('🐘 Connected to postgres: New database')
  } catch (e) {
    console.log('❌ Failed to connect or initialize postgres: New database')
    throw e
  }
}
