import { Inject, Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { H5PInfoResponse } from './h5pInfoResponse'
import { H5pContentApi } from './h5pContentApi'
import { ICache } from '../../cache'
import DiKeys from '../../initialization/diKeys'

export const getH5pContentsKey = (key: string) => `getH5pContents:${key}`

const logger = withLogger('H5pContentApi')

let callCount = 0
if (process.env.NODE_ENV !== 'test') {
  const scheduler = setTimeout(() => {
    logger.info(`H5P API call count (cached + non-cached): ${callCount}`)
  }, 24 * 60 * 60)
  const exitEvents = ['beforeExit', 'SIGINT', 'SIGTERM']
  exitEvents.forEach((event) => {
    process.on(event, function () {
      console.log(`${event} received...`)
      clearTimeout(scheduler)
    })
  })
}

@Service()
export class CachedH5pContentApi {
  public constructor(
    private readonly h5pContentApi: H5pContentApi,
    @Inject(DiKeys.ICache)
    private readonly cache: ICache,
    private readonly ttlSeconds = 24 * 60 * 60,
  ) {}

  public async getH5pContents(
    h5pIds: ReadonlyArray<string>,
    authenticationToken?: string,
  ): Promise<H5PInfoResponse> {
    callCount += 1
    const key = getH5pContentsKey(h5pIds.join(','))
    const cached = await this.cache.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    const response = await this.h5pContentApi.getH5pContents(
      h5pIds,
      authenticationToken,
    )
    if (response) {
      const json = JSON.stringify(response)
      await this.cache.set(key, json, this.ttlSeconds)
    }

    return response
  }
}
