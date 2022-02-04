import 'reflect-metadata'
import { expect } from 'chai'
import { LessonPlanBuilder, LessonMaterialBuilder } from '../builders'
import {
  RedisCache,
  RedisClientType,
  InMemoryCache,
  connectToRedisCache,
} from '../../src/cache'
import { delay } from '../../src/helpers/delay'

describe('Redis caching and InMermory caching', () => {
  let redisClient: RedisClientType
  let redisCache: RedisCache
  let inMemorycache: InMemoryCache

  before(async () => {
    redisClient = await connectToRedisCache(
      process.env.REDIS_URL || 'redis://localhost:6379',
    )
    redisCache = new RedisCache(redisClient)
    inMemorycache = new InMemoryCache()
  })

  after(async () => {
    await redisClient.quit()
  })

  context('LessonMaterials workflow: set, get, flush', () => {
    const lessonMaterial = new LessonMaterialBuilder()
      .withSubcontentId('')
      .withParentId('')
      .build()

    it('setLessonMaterials successfully', async () => {
      await redisCache.setLessonMaterial(lessonMaterial)
      await inMemorycache.setLessonMaterial(lessonMaterial)
      expect(true).to.be.equal(true)
    })

    it('getLessonMaterials returns the same value', async () => {
      const lessonMaterialFromRedis = await redisCache.getLessonMaterial(
        lessonMaterial.contentId,
      )
      const lessonMaterialFromInMemory = await inMemorycache.getLessonMaterial(
        lessonMaterial.contentId,
      )

      expect(lessonMaterial).to.deep.equal(lessonMaterialFromRedis)
      expect(lessonMaterial).to.deep.equal(lessonMaterialFromInMemory)
      expect(lessonMaterialFromRedis).to.deep.equal(lessonMaterialFromInMemory)
    })

    it('flushes successfully', async () => {
      await redisCache.flush()
      await inMemorycache.flush()

      const lessonMaterialFromRedis = await redisCache.getLessonMaterial(
        lessonMaterial.contentId,
      )
      const lessonMaterialFromInMemory = await inMemorycache.getLessonMaterial(
        lessonMaterial.contentId,
      )
      expect(lessonMaterialFromRedis).to.be.undefined
      expect(lessonMaterialFromInMemory).to.be.undefined
    })
  })

  context('LessonPlan with empty materials workflow: set, get, flush', () => {
    const lessonPlan = new LessonPlanBuilder().build()
    const cacheKey = `key:${lessonPlan.contentId}`

    it('setLessonMaterials successfully', async () => {
      await redisCache.setLessonPlanMaterials(cacheKey, [])
      await inMemorycache.setLessonPlanMaterials(cacheKey, [])
      expect(true).to.be.equal(true)
    })

    it('getLessonMaterials returns the same value', async () => {
      const lessonPlanMaterialsFromRedis =
        await redisCache.getLessonPlanMaterials(cacheKey)
      const lessonPlanMaterialsFromInMemory =
        await inMemorycache.getLessonPlanMaterials(cacheKey)

      expect([]).to.deep.equal(lessonPlanMaterialsFromRedis)
      expect([]).to.deep.equal(lessonPlanMaterialsFromInMemory)
    })

    it('flushes successfully', async () => {
      await redisCache.flush()
      await inMemorycache.flush()

      const lessonPlanMaterialsFromRedis =
        await redisCache.getLessonPlanMaterials(cacheKey)
      const lessonPlanMaterialsFromInMemory =
        await inMemorycache.getLessonPlanMaterials(cacheKey)

      expect(lessonPlanMaterialsFromRedis).to.be.undefined
      expect(lessonPlanMaterialsFromInMemory).to.be.undefined
    })
  })

  context('LessonPlan workflow: set, get, flush', () => {
    const lessonMaterial1 = new LessonMaterialBuilder()
      .withSubcontentId('')
      .withParentId('')
      .build()
    const lessonMaterial2 = new LessonMaterialBuilder()
      .withSubcontentId('')
      .withParentId('')
      .build()
    const lessonPlan = new LessonPlanBuilder()
      .addMaterialId(lessonMaterial1.contentId)
      .addMaterialId(lessonMaterial2.contentId)
      .build()
    const cacheKey = `key:${lessonPlan.contentId}`
    const lessonPlanMaterials = [lessonMaterial1, lessonMaterial2]

    it('setLessonMaterials successfully', async () => {
      await redisCache.setLessonPlanMaterials(cacheKey, lessonPlanMaterials)
      await inMemorycache.setLessonPlanMaterials(cacheKey, lessonPlanMaterials)
      expect(true).to.be.equal(true)
    })

    it('getLessonMaterials returns the same value', async () => {
      const lessonPlanMaterialsFromRedis =
        await redisCache.getLessonPlanMaterials(cacheKey)
      const lessonPlanMaterialsFromInMemory =
        await inMemorycache.getLessonPlanMaterials(cacheKey)

      expect(lessonPlanMaterials).to.deep.equal(lessonPlanMaterialsFromRedis)
      expect(lessonPlanMaterials).to.deep.equal(lessonPlanMaterialsFromInMemory)
      expect(lessonPlanMaterialsFromRedis).to.deep.equal(
        lessonPlanMaterialsFromInMemory,
      )
    })

    it('flushes successfully', async () => {
      await redisCache.flush()
      await inMemorycache.flush()

      const lessonPlanMaterialsFromRedis =
        await redisCache.getLessonPlanMaterials(cacheKey)
      const lessonPlanMaterialsFromInMemory =
        await inMemorycache.getLessonPlanMaterials(cacheKey)

      expect(lessonPlanMaterialsFromRedis).to.be.undefined
      expect(lessonPlanMaterialsFromInMemory).to.be.undefined
    })
  })

  context('setRecurringFlush works in both', () => {
    const lessonMaterial = new LessonMaterialBuilder()
      .withSubcontentId('')
      .withParentId('')
      .build()

    it('setLessonMaterials successfully', async () => {
      const timeout = 300
      const redisInterval = redisCache.setRecurringFlush(timeout)
      const inMemoryInterval = inMemorycache.setRecurringFlush(timeout)

      await redisCache.setLessonMaterial(lessonMaterial)
      await inMemorycache.setLessonMaterial(lessonMaterial)
      await delay(timeout * 2)

      const lessonMaterialFromRedis = await redisCache.getLessonMaterial(
        lessonMaterial.contentId,
      )
      const lessonMaterialFromInMemory = await inMemorycache.getLessonMaterial(
        lessonMaterial.contentId,
      )
      expect(lessonMaterialFromRedis).to.be.undefined
      expect(lessonMaterialFromInMemory).to.be.undefined

      clearInterval(redisInterval)
      clearInterval(inMemoryInterval)
    })
  })
})
