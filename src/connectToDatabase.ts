import path from 'path'
import { createConnection } from 'typeorm'

export async function connectToDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw Error('Please specify a value for DATABASE_URL.')
  }
  try {
    await createConnection({
      name: 'default',
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        'postgres://postgres:kidsloop@localhost',
      synchronize: false,
      logging: Boolean(process.env.DATABASE_LOGGING),
      entities: [
        path.join(__dirname, './entities/*.ts'),
        path.join(__dirname, './entities/*.js'),
      ],
    })
    console.log('🐘 Connected to postgres')
  } catch (e) {
    console.log('❌ Failed to connect or initialize postgres')
    throw e
  }
}
