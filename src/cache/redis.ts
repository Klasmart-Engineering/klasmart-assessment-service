/* eslint-disable @typescript-eslint/no-explicit-any */
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import Redis, { Cluster } from 'ioredis'
import { ICache } from './interface'

export type IoRedisClientType = Redis | Cluster
export type RedisMode = 'NODE' | 'CLUSTER'

const logger = withLogger('RedisCache')

export class RedisError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, RedisError.prototype)
  }
}

export const connectToIoRedis = async (
  mode: RedisMode,
  host: string,
  port: number,
): Promise<IoRedisClientType> => {
  let client: IoRedisClientType
  if (mode === 'CLUSTER') {
    logger.info('🏎 🏎 🏎 🏎  Creating CLUSTER mode Redis connection')
    client = new Redis.Cluster(
      [
        {
          host,
          port,
        },
      ],
      {
        lazyConnect: true,
        redisOptions: {
          password: process.env.REDIS_PASS,
          reconnectOnError: (err) => {
            const targetError = 'READONLY'
            if (err.message.includes(targetError)) {
              // Only reconnect when the error contains "READONLY"
              return true
            }
            return false
          },
        },
      },
    )
  } else {
    logger.info('🏎  Creating NODE mode Redis connection')
    client = new Redis(port, host, {
      lazyConnect: true,
      password: process.env.REDIS_PASS,
    })
  }

  client.on('error', async (err) => {
    logger.error('Redis Client Error', err)
    throw new RedisError(`Redis Client Error ${err}`)
  })
  try {
    logger.info('🏎  Attempting to connect to Redis')
    await client.connect()
    logger.info('🏎  Connected to Redis')
  } catch (e) {
    logger.error('❌ Failed to connect to Redis')
    await client.quit()
    throw e
  }
  return client
}

export const RedisErrorRecovery =
  (): MethodDecorator =>
  (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> => {
    const decoratorlogger = withLogger('RedisErrorRecovery')
    const originalMethod = descriptor.value
    // important => don't use an arrow function because we're passing `this`
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        decoratorlogger.error(
          `Redis Error Recovery (${originalMethod.name}):`,
          String(error),
        )
        if (error instanceof RedisError) {
          return undefined
        }
        decoratorlogger.error('Cannot recover from Error: ', String(error))
        throw error
      }
    }
    return descriptor
  }

export class RedisCache implements ICache {
  constructor(private readonly redisClient: IoRedisClientType) {}

  prefix = (key: string) => `assessment:${key}`

  @RedisErrorRecovery()
  get(key: string): Promise<string | null> {
    return this.redisClient.get(this.prefix(key))
  }

  // nx: Only set the key if it does not already exist.
  // ex: Set the specified expire time, in seconds.
  // px: Set the specified expire time, in milliseconds.
  @RedisErrorRecovery()
  set(key: string, value: string, ttlSeconds: number): Promise<'OK' | null> {
    return this.redisClient.set(this.prefix(key), value, 'EX', ttlSeconds, 'NX')
  }

  @RedisErrorRecovery()
  async delete(key: string): Promise<void> {
    await this.redisClient.del(this.prefix(key))
  }
}
