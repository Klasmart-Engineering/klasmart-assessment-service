import 'reflect-metadata'
import { expect } from 'chai'
import { RedisErrorRecovery, RedisError } from '../../../src/cache'

describe('Redis Caching', () => {
  context('RedisErrorRecovery decorator', () => {
    class RedisCacheClassDemo {
      @RedisErrorRecovery()
      async successfulMethod() {
        return 1
      }

      @RedisErrorRecovery()
      async recoverableMethod() {
        throw new RedisError('something wrong with Redis')
      }

      @RedisErrorRecovery()
      async unrecoverableMethod() {
        throw Error('some other error')
      }
    }
    const redisCacheInstance = new RedisCacheClassDemo()

    it('successful method runs normally', async () => {
      const result = await redisCacheInstance.successfulMethod()
      expect(result).to.be.equal(1)
    })

    it('function recovers from RedisError and returns undefined', async () => {
      const result = await redisCacheInstance.recoverableMethod()
      expect(result).to.be.undefined
    })

    it('function throws for any errors other than RedisError', async () => {
      const fn = () => redisCacheInstance.unrecoverableMethod()
      expect(fn()).to.be.rejectedWith(Error)
    })
  })
})
