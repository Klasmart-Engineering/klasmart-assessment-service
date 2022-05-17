import { Inject, Service } from 'typedi'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import ContentResponse, { ContentDto } from './contentResponse'
import { FetchWrapper } from '../fetchWrapper'
import DiKeys from '../../initialization/diKeys'
import { ErrorMessage } from '../../helpers/errorMessages'
import { UserInputError } from 'apollo-server-core'

const logger = withLogger('CmsContentApi')

@Service()
export class CmsContentApi {
  public constructor(
    private readonly fetchWrapper: FetchWrapper,
    @Inject(DiKeys.CmsApiUrl)
    private readonly baseUrl: string,
  ) {}

  public async getLessonMaterials(
    roomId: string,
    authenticationToken?: string,
  ): Promise<ContentResponse> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const requestUrl = `${this.baseUrl}/contents?schedule_id=${roomId}`

    const response = await this.fetchWrapper.fetch<ContentResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      },
    )
    if (!response) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
    }

    return response
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<ContentDto | undefined> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const requestUrl = `${this.baseUrl}/contents?content_ids=${contentId}`

    const response = await this.fetchWrapper.fetch<ContentResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      },
    )

    const dtos = response?.list ?? []
    logger.debug(
      `getLessonMaterial >> contentId: ${contentId}, ${
        dtos.length > 0 ? 'FOUND' : 'NOT FOUND'
      }`,
    )

    if (dtos.length === 0) {
      return undefined
    }

    return dtos[0]
  }

  public async getLessonMaterialsWithSourceId(
    sourceId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<ContentDto>> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const requestUrl = `${this.baseUrl}/contents?source_id=${sourceId}`

    const response = await this.fetchWrapper.fetch<ContentResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          cookie: `access=${authenticationToken}`,
        },
      },
    )

    const dtos = response?.list ?? []
    logger.debug(
      `getLessonMaterials >> sourceId: ${sourceId}, ` +
        `ContentDto count: ${dtos.length}`,
    )

    return dtos
  }
}
