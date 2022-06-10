import expect from '../utils/chaiAsPromisedSetup'
import {
  InMemoryCache,
  DateClock,
  IClock,
  MemoryCacheRecord,
} from '../../src/cache/inMemory'

describe('InMemoryCache', () => {
  describe('get', () => {
    context('key exists in cache; not expired', () => {
      it('returns corresponding value', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 1000,
        }
        const map = new Map([[cacheKey, record]])
        const sut = new InMemoryCache(new TestClock(), map)

        // Act
        const expected = cacheValue
        const actual = await sut.get(cacheKey)

        // Assert
        expect(actual).equal(expected)
      })
    })

    context('key exists in cache; expired', () => {
      it('returns null', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 10,
        }
        const map = new Map([[cacheKey, record]])
        const sut = new InMemoryCache(new TestClock(12), map)

        // Act
        const expected = null
        const actual = await sut.get(cacheKey)

        // Assert
        expect(actual).equal(expected)
      })
    })

    context('key does not exist in cache', () => {
      it('returns null', async () => {
        // Arrange
        const cacheKey = 'key1'
        const map = new Map<string, MemoryCacheRecord>()
        const sut = new InMemoryCache(new TestClock(), map)

        // Act
        const expected = null
        const actual = await sut.get(cacheKey)

        // Assert
        expect(actual).equal(expected)
      })
    })
  })

  describe('set', () => {
    context('key does not exist in cache', () => {
      it('returns "OK"', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const map = new Map<string, MemoryCacheRecord>()
        const sut = new InMemoryCache(new TestClock(), map)

        const ttlSeconds = 1

        // Act
        const expected = 'OK'
        const actual = await sut.set(cacheKey, cacheValue, ttlSeconds)

        // Assert
        expect(actual).equal(expected)

        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 1000,
        }
        expect(map).has.lengthOf(1)
        expect(map.get(cacheKey)).deep.equals(record)
      })
    })

    context('key exists in cache and has not expired', () => {
      it('returns null', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const map = new Map<string, MemoryCacheRecord>()
        const sut = new InMemoryCache(new TestClock(), map)

        const ttlSeconds1 = 1
        const ttlSeconds2 = 2
        await sut.set(cacheKey, cacheValue, ttlSeconds1)

        // Act
        const expected = null
        const actual = await sut.set(cacheKey, cacheValue, ttlSeconds2)

        // Assert
        expect(actual).equal(expected)

        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: ttlSeconds1 * 1000,
        }
        expect(map).has.lengthOf(1)
        expect(map.get(cacheKey)).deep.equals(record)
      })
    })

    context('key exists in cache and has expired', () => {
      it('returns "OK"', async () => {
        // Arrange
        const cacheKey = 'key1'
        const cacheValue = 'value1'
        const map = new Map<string, MemoryCacheRecord>()
        const clock = new TestClock()
        const sut = new InMemoryCache(clock, map)

        const ttlSeconds1 = 1
        const ttlSeconds2 = 2
        await sut.set(cacheKey, cacheValue, ttlSeconds1)
        clock.addMs(1500)

        // Act
        const expected = 'OK'
        const actual = await sut.set(cacheKey, cacheValue, ttlSeconds2)

        // Assert
        expect(actual).equal(expected)

        const record: MemoryCacheRecord = {
          value: cacheValue,
          expirationMs: 1500 + ttlSeconds2 * 1000,
        }
        expect(map).has.lengthOf(1)
        expect(map.get(cacheKey)).deep.equals(record)
      })
    })
  })

  describe('prune', () => {
    context('1 expired key and 1 non-expired key exist', () => {
      it('deletes the expired key', async () => {
        // Arrange
        const cacheKey1 = 'key1'
        const cacheKey2 = 'key2'
        const cacheValue = 'value'
        const map = new Map<string, MemoryCacheRecord>([
          [cacheKey1, { value: cacheValue, expirationMs: 10 }],
          [cacheKey2, { value: cacheValue, expirationMs: 20 }],
        ])
        const clock = new TestClock()
        const sut = new InMemoryCache(clock, map)

        // Act
        clock.addMs(15)
        sut.prune()

        // Assert
        expect(map).to.have.lengthOf(1)
        expect(map).to.have.key(cacheKey2)
      })
    })
  })
})

describe('DateClock.now', () => {
  it('executes without error', async () => {
    // Arrange
    const sut = new DateClock()

    // Act
    const actual = sut.now()
    const expected = Date.now()

    // Assert
    expect(actual).to.equal(expected)
  })
})

export class TestClock implements IClock {
  constructor(private currentMs = 0) {}

  now(): number {
    return this.currentMs
  }

  public addMs(ms: number) {
    this.currentMs += ms
  }
}
