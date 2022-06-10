import { ICache } from './interface'

export class InMemoryCache implements ICache {
  constructor(
    private readonly clock: IClock,
    private readonly cache = new Map<string, MemoryCacheRecord>(),
  ) {}

  get(key: string): Promise<string | null> {
    const record = this.cache.get(key)
    if (record == null) {
      return Promise.resolve(null)
    }
    if (record.expirationMs && record.expirationMs < this.clock.now()) {
      this.cache.delete(key)
      return Promise.resolve(null)
    }
    return Promise.resolve(record.value)
  }

  set(key: string, value: string, ttlSeconds: number): Promise<'OK' | null> {
    const record = this.cache.get(key)
    if (record && record.expirationMs >= this.clock.now()) {
      return Promise.resolve(null)
    }
    this.cache.set(key, {
      expirationMs: this.clock.now() + ttlSeconds * 1000,
      value,
    })
    return Promise.resolve('OK')
  }

  delete(key: string): Promise<void> {
    this.cache.delete(key)
    return Promise.resolve()
  }

  prune() {
    for (const [key, record] of this.cache) {
      if (record.expirationMs && record.expirationMs < this.clock.now()) {
        this.cache.delete(key)
      }
    }
  }
}

export type MemoryCacheRecord = {
  value: string
  expirationMs: number
}

export interface IClock {
  now(): number
}

export class DateClock implements IClock {
  now(): number {
    return Date.now()
  }
}
