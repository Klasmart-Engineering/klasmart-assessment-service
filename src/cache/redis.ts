import { createClient } from 'redis'
import { withLogger } from 'kidsloop-nodejs-logger'
import { ICache } from './interface'
import { Content } from '../db/cms/entities/content'

export type RedisClientType = ReturnType<typeof createClient>
const logger = withLogger('redis')

export class RedisError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, RedisError.prototype)
  }
}

export const connectToRedisCache = async (
  url: string,
): Promise<RedisClientType> => {
  const client: RedisClientType = createClient({
    url,
  })
  client.on('error', (err) => {
    logger.error('Redis Client Error', err.message)
    throw new RedisError(`Redis Client Error ${err.message}`)
  })
  try {
    await client.connect()
    logger.info('☕️ Connected to Redis')
  } catch (e) {
    logger.error('❌ Failed to connect to Redis')
    throw e
  }
  return client
}

const prefix = `assessment`
const assessmentKey = (key: string) => `${prefix}:${key}`
const materialKey = (key: string) => `${prefix}:material:${key}`
const planKey = (key: string) => `${prefix}:plan:${key}`

export const RedisErrorRecovery =
  (): MethodDecorator =>
  (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> => {
    const originalMethod = descriptor.value
    // important => don't use an arrow function because we're passing `this`
    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } catch (error) {
        logger.debug('Redis Error Recovery:', error)
        if (error instanceof RedisError) {
          return undefined
        }
        throw error
      }
    }
    return descriptor
  }

export class RedisCache implements ICache {
  constructor(private readonly client: RedisClientType) {}

  @RedisErrorRecovery()
  public async getLessonMaterial(
    contentId: string,
  ): Promise<Content | undefined> {
    const hit = await this.client.get(materialKey(contentId))
    logger.debug(
      `getLessonMaterial >> contentId: ${contentId}, ${
        hit ? `HIT: ${hit.substr(0, 30)}` : 'MISS'
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
    logger.debug(`setLessonMaterial >> contentId: ${material.contentId}`)
    await this.client.set(
      materialKey(material.contentId),
      JSON.stringify(material),
    )
  }

  @RedisErrorRecovery()
  public async getLessonPlanMaterials(
    cacheKey: string,
  ): Promise<Content[] | undefined> {
    const planCacheKey = planKey(cacheKey)
    const hit = await this.client.get(planCacheKey)
    logger.debug(
      `getLessonPlanMaterials >> cacheKey: ${planCacheKey}, ${
        hit ? 'HIT' : 'MISS'
      }`,
    )
    if (hit) {
      const contentIds: string[] = JSON.parse(hit)
      let materials: Content[] = []

      if (contentIds.length > 0) {
        materials = (await this.client.mGet(contentIds))
          .filter((x): x is string => x != null)
          .map((m): Content => JSON.parse(m))
      }
      logger.debug(
        `getLessonPlanMaterials >> materials found: ${materials.length}`,
      )
      return materials
    }
    return undefined
  }

  @RedisErrorRecovery()
  public async setLessonPlanMaterials(
    cacheKey: string,
    materials: Content[],
  ): Promise<void> {
    const materialMap: [string, string][] = materials.map((material) => [
      materialKey(material.contentId),
      JSON.stringify(material),
    ])
    const materialMapKeys = materialMap.map((x) => x[0])
    const planCacheKey = planKey(cacheKey)
    logger.debug(
      `setLessonPlanMaterials >> cacheKey: ${planCacheKey}, materials count: ${materialMap.length}`,
    )
    if (materialMap.length > 0) {
      await this.client
        .multi()
        .mSet(materialMap)
        .set(planCacheKey, JSON.stringify(materialMapKeys))
        .exec()
    } else {
      await this.client.set(planCacheKey, JSON.stringify([]))
    }
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
