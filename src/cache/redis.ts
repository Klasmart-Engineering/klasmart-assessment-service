import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import Redis, { Cluster } from 'ioredis'
import { ICache } from './interface'
import { Content } from '../db/cms/entities/content'

export type IoRedisClientType = Redis | Cluster
export type RedisMode = 'NODE' | 'CLUSTER'

const logger = withLogger('RedisCache')

export class RedisError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, RedisError.prototype)
  }
}

const prefix = `assessment`
const assessmentKey = (key: string) => `${prefix}:${key}`
const materialKey = (key: string) => `${prefix}:material:${key}`

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
  constructor(private readonly client: IoRedisClientType) {}

  @RedisErrorRecovery()
  public async getLessonMaterial(
    contentId: string,
  ): Promise<Content | undefined> {
    const hit = await this.client.get(materialKey(contentId))
    logger.debug(
      `getLessonMaterial >> contentId: ${contentId}, ${
        hit ? `HIT: ${hit.substring(0, 30)}...` : 'MISS'
      }`,
    )
    if (hit) {
      const material: Content = JSON.parse(hit)
      return material
    }
    return undefined
  }

  @RedisErrorRecovery()
  public async setLessonMaterial(material: Content): Promise<void> {
    logger.warn(`setLessonMaterial >> contentId: ${material.contentId}`)
    await this.client.set(
      materialKey(material.contentId),
      JSON.stringify(material),
    )
  }

  @RedisErrorRecovery()
  public async setLessonPlanMaterials(materials: Content[]): Promise<void> {
    logger.warn(
      `setLessonPlanMaterials >> materials count: ${materials.length}`,
    )
    await Promise.all(
      materials.map((material) =>
        this.client.set(
          materialKey(material.contentId),
          JSON.stringify(material),
        ),
      ),
    )
  }

  @RedisErrorRecovery()
  public async flush(): Promise<void> {
    const keys = await this.client.keys(assessmentKey('*'))
    logger.debug(`flush >> keys found: ${keys.length}`)
    await this.client.del(keys)
  }

  public setRecurringFlush(ms: number): NodeJS.Timeout {
    logger.debug(`setRecurringFlush >> ms: ${ms}`)
    return setInterval(() => this.flush(), ms)
  }
}
