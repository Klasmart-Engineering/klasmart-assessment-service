import 'reflect-metadata'
import { RedisErrorRecovery, IoRedisClientType } from '../cache/redis'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('RedisStreams')

type ReadStreamReply = [stream: string, entries: Entry[]][]
type Entry = [
  entryId: string,
  messages: [key: 'data', value: string] | string[],
]

interface TuplesObject {
  [field: string]: string
}

export interface StreamMessageReply {
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
    options: { count?: number; block?: number; streamKey?: string },
  ): Promise<StreamMessageReply[] | null> {
    logger.debug(`read >> stream: ${stream}`)
    const { count, block, streamKey } = options
    const entries = await (count
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
      const streamEntries = entries[0][1].map((val: any) => {
        const entryId = val[0]
        const message = val[1]

        const numKeyValuePairs = Math.floor(message.length / 2)
        const msgObject =
          Array.from(Array(numKeyValuePairs).keys()).reduce(
            (acc, idx) =>
              Object.assign(acc, { [message[2 * idx]]: message[2 * idx + 1] }),
            {},
          ) || {}

        return {
          id: entryId,
          message: msgObject,
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
  public async infoStream(stream: string) {
    return this.client.xinfo('STREAM', stream)
  }

  @RedisErrorRecovery()
  public async infoGroups(stream: string) {
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
  public async ack(stream: string, group: string, ids: string[]) {
    try {
      await this.client.xack(stream, group, ...ids)
    } catch (error) {
      logger.error('client.xack failed.', {
        error: error.message,
        stream,
        group,
        ids,
      })
      throw error
    }
  }

  // XREADGROUP GROUP mygroup Alice COUNT 1 STREAMS mystream >
  @RedisErrorRecovery()
  public async readGroup(
    stream: string,
    groupName: string,
    consumerName: string,
    opts: { count?: number; block?: number; streamKey?: string },
  ): Promise<StreamMessageReply[] | null> {
    const { count, block, streamKey } = opts

    let entries: ReadStreamReply | null
    if (count && block) {
      entries = (await this.client.xreadgroup(
        'GROUP',
        groupName,
        consumerName,
        'COUNT',
        count,
        'BLOCK',
        block,
        'STREAMS',
        stream,
        streamKey || '>',
      )) as ReadStreamReply | null
    } else if (count) {
      entries = (await this.client.xreadgroup(
        'GROUP',
        groupName,
        consumerName,
        'COUNT',
        count,
        'STREAMS',
        stream,
        streamKey || '>',
      )) as ReadStreamReply | null
    } else if (block) {
      entries = (await this.client.xreadgroup(
        'GROUP',
        groupName,
        consumerName,
        'BLOCK',
        block,
        'STREAMS',
        stream,
        streamKey || '>',
      )) as ReadStreamReply | null
    } else {
      entries = (await this.client.xreadgroup(
        'GROUP',
        groupName,
        consumerName,
        'STREAMS',
        stream,
        streamKey || '>',
      )) as ReadStreamReply | null
    }

    if (!entries) {
      return null
    }

    if (entries.length > 0 && entries[0].length > 1) {
      const thisStream = entries[0]
      const thisStreamEntries = thisStream[1]
      const streamEntries = thisStreamEntries.map((val) => {
        const entryId = val[0]
        const message = val[1]

        const numKeyValuePairs = Math.floor(message.length / 2)
        const msgObject =
          Array.from(Array(numKeyValuePairs).keys()).reduce(
            (acc, idx) =>
              Object.assign(acc, { [message[2 * idx]]: message[2 * idx + 1] }),
            {},
          ) || {}

        return {
          id: entryId,
          message: msgObject,
        }
      })
      return streamEntries
    }
    return null
  }
}
