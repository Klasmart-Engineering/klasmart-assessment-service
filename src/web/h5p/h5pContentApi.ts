import { Inject, Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { H5PInfoResponse } from './h5pInfoResponse'
import { FetchWrapper } from '../fetchWrapper'
import DiKeys from '../../initialization/diKeys'
import { ErrorMessage } from '../../helpers/errorMessages'

const logger = withLogger('H5pContentApi')

@Service()
export class H5pContentApi {
  public constructor(
    private readonly fetchWrapper: FetchWrapper,
    @Inject(DiKeys.H5pUrl)
    private readonly baseUrl: string,
  ) {}

  public async getH5pContents(
    h5pIds: ReadonlyArray<string>,
    authenticationToken?: string,
  ): Promise<H5PInfoResponse> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const h5pIdCsv = h5pIds.join(',')
    const requestUrl = `${this.baseUrl}/content_info?contentIds=${h5pIdCsv}`

    const response = await this.fetchWrapper.fetch<H5PInfoResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      },
    )
    if (!response) {
      throw new Error('[H5pContentApi] Request failed.')
    }

    return response
  }
}
