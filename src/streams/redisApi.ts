import 'reflect-metadata'
import { RedisClientType, RedisErrorRecovery } from '../cache/redis'

export const STREAM_NAME = 'mystream'
export const GROUP_NAME = 'mygroup'

interface IRead {
  name: string
  messages: any[]
}

interface TuplesObject {
  [field: string]: string
}

interface IReadGroup {
  id: string
  message: TuplesObject
}

// Basic cmds: XADD, XLEN , XRANGE, XREVRANGE, XDEL, XINFO
// Consumer groups: XREADGROUP, XGROUP, XREADGROUP, XACK
// Error Recovery: XPENDING, XCLAIM, XAUTOCLAIM

export class RedisStreams {
  constructor(private readonly client: RedisClientType) {}

  // XADD mystream  * data 123 roomId 1 id 1
  // XADD mystream  * data 123 roomId 1 id 2
  // XADD mystream  * data 123 roomId 1 id 3
  @RedisErrorRecovery()
  public async add(stream: string, event: TuplesObject): Promise<string> {
    const entryId = await this.client.xAdd(stream, '*', event)
    return entryId
  }

  // XLEN mystream
  @RedisErrorRecovery()
  public async length(stream: string) {
    return this.client.xLen(stream)
  }

  // XRANGE mystream - +
  @RedisErrorRecovery()
  public async getRange(stream: string, start: string, end: string, opts: any) {
    return this.client.xRange(stream, start, end, opts)
  }

  // XREVRANGE mystream + -
  @RedisErrorRecovery()
  public async getRevRange(
    stream: string,
    start: string,
    end: string,
    opts: any,
  ) {
    return this.client.xRevRange(stream, start, end, opts)
  }

  // XREAD COUNT 2 STREAMS mystream 0
  // XREAD BLOCK 0 STREAMS mystream $
  @RedisErrorRecovery()
  public async read(
    stream: string,
    { count, block, streamKey }: any,
  ): Promise<IRead | null> {
    const entries = await this.client.xRead(
      { key: stream, id: streamKey || '$' },
      { COUNT: count || undefined, BLOCK: block || 0 },
    )
    if (entries && entries.length > 0) {
      return entries[0]
    }
    return null
  }

  // XDEL mystream 1526654999635-0
  @RedisErrorRecovery()
  public async del(stream: string, ids: string[]) {
    return this.client.xDel(stream, ids)
  }

  // XINFO STREAM mystream
  @RedisErrorRecovery()
  public async info(stream: string) {
    return this.client.xInfoStream(stream)
  }

  // XPENDING mystream mygroup
  @RedisErrorRecovery()
  public async pending(stream: string, group: string) {
    return this.client.xPending(stream, group)
  }

  // XGROUP CREATE mystream mygroup $ MKSTREAM
  @RedisErrorRecovery()
  public async createGroup(stream: string, group: string) {
    return this.client.xGroupCreate(stream, group, '$', {
      MKSTREAM: true,
    })
  }

  // XACK mystream mygroup 1526569495631-0
  @RedisErrorRecovery()
  public async ack(stream: string, group: string, id: string | string[]) {
    return this.client.xAck(stream, group, id)
  }

  // XREADGROUP GROUP mygroup Alice COUNT 1 STREAMS mystream >
  @RedisErrorRecovery()
  public async readGroup(
    stream: string,
    groupName: string,
    consumerName: string,
    { count, block, streamKey }: any,
  ): Promise<IReadGroup[] | null> {
    const entries = await this.client.xReadGroup(
      groupName,
      consumerName,
      { key: stream, id: streamKey || '>' },
      { BLOCK: block || undefined, COUNT: count || undefined },
    )
    if (entries && entries.length > 0) {
      const streamEntries = entries[0].messages
      return streamEntries
    }
    return null
  }
}
