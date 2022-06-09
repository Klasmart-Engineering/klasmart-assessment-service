import 'reflect-metadata'
import { expect } from 'chai'
import { LessonMaterialBuilder } from '../builders'
import {
  RedisCache,
  IoRedisClientType,
  InMemoryCache,
  connectToIoRedis,
} from '../../src/cache'
import { delay } from '../../src/helpers/delay'

describe('Redis caching and InMermory caching', () => {
  let redisClient: IoRedisClientType
  let redisCache: RedisCache
  let inMemorycache: InMemoryCache

  before(async () => {
    redisClient = await connectToIoRedis('NODE', 'localhost', 6379)
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
      .withContentType('')
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
    it('setLessonMaterials successfully', async () => {
      await redisCache.setLessonPlanMaterials([])
      await inMemorycache.setLessonPlanMaterials([])
      expect(true).to.be.equal(true)
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
    const lessonPlanMaterials = [lessonMaterial1, lessonMaterial2]

    it('setLessonMaterials successfully', async () => {
      await redisCache.setLessonPlanMaterials(lessonPlanMaterials)
      await inMemorycache.setLessonPlanMaterials(lessonPlanMaterials)
      expect(true).to.be.equal(true)
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
