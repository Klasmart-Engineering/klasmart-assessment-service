import 'reflect-metadata'
import Redis, { Cluster } from 'ioredis'
import { RedisError, RedisErrorRecovery } from '../cache/redis'
import { withLogger } from 'kidsloop-nodejs-logger'

export type IoRedisClientType = Redis | Cluster
export type RedisMode = 'NODE' | 'CLUSTER'

const logger = withLogger('RedisStreams')

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

  client.on('error', (err) => {
    logger.error('Redis Client Error', err.message)
    throw new RedisError(`Redis Client Error ${err.message}`)
  })
  try {
    await client.connect()
    logger.info('🏎  Connected to Redis')
  } catch (e) {
    logger.error('❌ Failed to connect to Redis')
    throw e
  }
  return client
}

export const STREAM_NAME = 'mystream'
export const GROUP_NAME = 'mygroup'

type ReadStreamReply = [stream: string, entries: Entry[]][]
type Entry = [
  entryId: string,
  messages: [key: 'data', value: string] | string[],
]

interface TuplesObject {
  [field: string]: string
}

interface StreamMessageReply {
  id: string
  message: TuplesObject
}

// Basic cmds: XADD, XLEN , XRANGE, XREVRANGE, XDEL, XINFO
// Consumer groups: XREADGROUP, XGROUP, XREADGROUP, XACK
// Error Recovery: XPENDING, XCLAIM, XAUTOCLAIM

export class RedisStreams {
  constructor(private readonly client: IoRedisClientType) {}

  // XADD mystream  * data 123 roomId 1 id 1
  // XADD mystream  * data 123 roomId 1 id 2
  // XADD mystream  * data 123 roomId 1 id 3
  @RedisErrorRecovery()
  public async add(stream: string, event: TuplesObject): Promise<string> {
    const entryId = (await this.client.xadd(
      stream,
      '*',
      ...Object.entries(event).flat(),
    )) as string
    return entryId
  }

  // XLEN mystream
  @RedisErrorRecovery()
  public async length(stream: string) {
    return this.client.xlen(stream)
  }

  // XRANGE mystream - +
  @RedisErrorRecovery()
  public async getRange(stream: string, start: string, end: string, opts: any) {
    return this.client.xrange(stream, start, end, opts)
  }

  // XREVRANGE mystream + -
  @RedisErrorRecovery()
  public async getRevRange(
    stream: string,
    start: string,
    end: string,
    opts: any,
  ) {
    return this.client.xrevrange(stream, start, end, opts)
  }

  // XREAD COUNT 2 STREAMS mystream 0
  // XREAD BLOCK 0 STREAMS mystream $
  @RedisErrorRecovery()
  public async read(
    stream: string,
    { count, block, streamKey }: any,
  ): Promise<StreamMessageReply[] | null> {
    logger.debug(`read >> stream: ${stream}`)
    let entries = await (count
      ? this.client.xread(
          'COUNT',
          count,
          'BLOCK',
          block || 0,
          'STREAMS',
          stream,
          streamKey || '$',
        )
      : this.client.xread(
          'BLOCK',
          block || 0,
          'STREAMS',
          stream,
          streamKey || '$',
        ))
    if (!entries) {
      return null
    }
    if (entries.length > 0 && entries[0].length > 1) {
      // @ts-ignore
      const streamEntries = entries[0][1].map((val) => {
        const entryId = val[0]
        const message = val[1]
        return {
          id: entryId,
          message: {
            [message[0]]: message[1],
          },
        }
      })
      return streamEntries
    }
    return null
  }

  // XDEL mystream 1526654999635-0
  @RedisErrorRecovery()
  public async del(stream: string, ids: string[]) {
    return this.client.xdel(stream, ...ids)
  }

  // XINFO STREAM mystream
  @RedisErrorRecovery()
  public async infoStream(stream: string): Promise<any[]> {
    // @ts-ignore
    return this.client.xinfo('STREAM', stream)
  }

  @RedisErrorRecovery()
  public async infoGroups(stream: string): Promise<any[]> {
    // @ts-ignore
    return this.client.xinfo('GROUPS', stream)
  }

  // XPENDING mystream mygroup
  @RedisErrorRecovery()
  public async pending(stream: string, group: string) {
    return this.client.xpending(stream, group)
  }

  // XGROUP CREATE mystream mygroup $ MKSTREAM
  @RedisErrorRecovery()
  public async createGroup(stream: string, group: string, onlyLatest = false) {
    return this.client.xgroup(
      'CREATE',
      stream,
      group,
      onlyLatest ? '$' : '0',
      'MKSTREAM',
    )
  }

  // XGROUP DESTROY mystream mygroup
  @RedisErrorRecovery()
  public async deleteGroup(stream: string, group: string) {
    return this.client.xgroup('DESTROY', stream, group)
  }

  // XGROUP DELCONSUMER mystream mygroup myconsumer
  @RedisErrorRecovery()
  public async deleteConsumer(stream: string, group: string, consumer: string) {
    return this.client.xgroup('DELCONSUMER', stream, group, consumer)
  }

  // XACK mystream mygroup 1526569495631-0
  @RedisErrorRecovery()
  public async ack(stream: string, group: string, id: string | string[]) {
    const ids = [id].flat()
    return this.client.xack(stream, group, ...ids)
  }

  // XREADGROUP GROUP mygroup Alice COUNT 1 STREAMS mystream >
  @RedisErrorRecovery()
  public async readGroup(
    stream: string,
    groupName: string,
    consumerName: string,
    { count, block, streamKey }: any,
  ): Promise<StreamMessageReply[] | null> {
    const args = []
    if (count) {
      args.push('COUNT', count)
    }
    if (block) {
      args.push('BLOCK', block)
    }
    args.push('STREAMS', stream, streamKey || '>')

    const entries = (await this.client.xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      // @ts-ignore
      ...args,
    )) as ReadStreamReply | null
    if (!entries) {
      return null
    }

    if (entries.length > 0 && entries[0].length > 1) {
      const thisStream = entries[0]
      const thisStreamEntries = thisStream[1]
      const streamEntries = thisStreamEntries.map((val) => {
        const entryId = val[0]
        const message = val[1]
        const msgOject =
          message.length >= 2
            ? {
                [message[0]]: message[1],
              }
            : {}
        return {
          id: entryId,
          message: msgOject,
        }
      })
      return streamEntries
    }
    return null
  }
}
