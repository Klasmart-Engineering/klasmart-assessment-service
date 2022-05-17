import fetch, { RequestInfo, RequestInit } from 'node-fetch'
import { Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('FetchWrapper')

@Service()
export class FetchWrapper {
  public async fetch<TResponse>(
    url: RequestInfo,
    init: RequestInit,
  ): Promise<TResponse | undefined> {
    const fetchPromise = fetch(url, init)
    const response = await fetchPromise
    if (!response.ok) {
      logger.error(
        `Request failed. response status: ${response.status}, request url: ${url}`,
      )
      return undefined
    }
    const body = await response.json()
    return body as TResponse
  }
}
