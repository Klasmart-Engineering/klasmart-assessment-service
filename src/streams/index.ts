import 'reflect-metadata'
import { RedisClientType } from '../cache/redis'

export const STREAM_NAME = 'mystream'
export const GROUP_NAME = 'mygroup'

interface IReadGroup {
  name: string
  messages: any[]
}

// Basic cmds: XADD, XLEN , XRANGE, XREVRANGE, XDEL, XINFO
// Consumer groups: XREADGROUP, XGROUP, XREADGROUP, XACK
// Error Recovery: XPENDING, XCLAIM, XAUTOCLAIM

export class RedisStreams {
  public client: RedisClientType

  constructor(client: RedisClientType) {
    this.client = client
  }

  // XADD mystream  * data 123 roomId 1 id 1
  // XADD mystream  * data 123 roomId 1 id 2
  // XADD mystream  * data 123 roomId 1 id 3
  public async add(event: any): Promise<string> {
    const entryId = await this.client.xAdd(STREAM_NAME, '*', event)
    return entryId
  }

  // XLEN mystream
  public async length() {
    return this.client.xLen(STREAM_NAME)
  }

  // XRANGE mystream - +
  public async getRange(start: string, end: string, opts: any) {
    return this.client.xRange(STREAM_NAME, start, end, opts)
  }

  // XREVRANGE mystream + -
  public async getRevRange(start: string, end: string, opts: any) {
    return this.client.xRevRange(STREAM_NAME, start, end, opts)
  }

  // XREAD COUNT 2 STREAMS mystream 0
  // XREAD BLOCK 0 STREAMS mystream $
  public async read({
    count,
    block,
    streamKey,
  }: any): Promise<IReadGroup | null> {
    const entries = await this.client.xRead(
      { key: STREAM_NAME, id: streamKey || '$' },
      { COUNT: count || undefined, BLOCK: block || 0 },
    )
    if (entries && entries.length > 0) {
      return entries[0]
    }
    return null
  }

  // XDEL mystream 1526654999635-0
  public async del(ids: string[]) {
    return this.client.xDel(STREAM_NAME, ids)
  }

  // XINFO STREAM mystream
  public async info() {
    return this.client.xInfoStream(STREAM_NAME)
  }

  // XPENDING mystream mygroup
  public async pending() {
    return this.client.xPending(STREAM_NAME, GROUP_NAME)
  }

  // XGROUP CREATE mystream mygroup $ MKSTREAM
  public async createGroup(groupName: string) {
    return this.client.xGroupCreate(STREAM_NAME, groupName, '$', {
      MKSTREAM: true,
    })
  }

  // XACK mystream mygroup 1526569495631-0
  public async ack(id: string) {
    return this.client.xAck(STREAM_NAME, GROUP_NAME, id)
  }

  // XREADGROUP GROUP mygroup Alice COUNT 1 STREAMS mystream >

  public readGroup = async (
    groupName: string,
    consumerName: string,
    { count, block, streamKey }: any,
  ): Promise<IReadGroup | null> => {
    const entries = await this.client.xReadGroup(
      groupName,
      consumerName,
      { key: STREAM_NAME, id: streamKey || '>' },
      { BLOCK: block || 0, COUNT: count || 0 },
    )
    if (entries && entries.length > 0) {
      return entries[0]
    }
    return null
  }
}

// const main = async () => {
//   const url = process.env.REDIS_URL || ''
//   client = await connectToRedisCache(url)

//   continuouslyGenerateEvents(500)

//   const consumers = ['consumer_1']
//   for (let name of consumers) {
//     consume(name)
//   }
// }

// main()
//   .then(() => {
//     console.log('success')
//   })
//   .catch((err) => {
//     console.error(err)
//   })
