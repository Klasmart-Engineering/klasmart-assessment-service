import path from 'path'
import { createConnection } from 'typeorm'

export const USERS_CONNECTION_NAME = 'users'

export async function connectToUserDatabase(): Promise<void> {
  const url = process.env.USER_DATABASE_URL
  if (!url) {
    throw new Error('Please specify a value for USER_DATABASE_URL')
  }

  try {
    await createConnection({
      name: USERS_CONNECTION_NAME,
      type: 'postgres',
      url,
      synchronize: false,
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
    })
    console.log('🐘 Connected to postgres: User database')
  } catch (e) {
    console.log('❌ Failed to connect or initialize postgres: User database')
    throw e
  }
}
