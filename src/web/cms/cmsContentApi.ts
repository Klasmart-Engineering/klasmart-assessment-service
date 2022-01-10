import { Inject, Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'
import ContentResponse, { ContentDto } from './contentResponse'
import { FetchWrapper } from '../fetchWrapper'
import DiKeys from '../../initialization/diKeys'
import { ErrorMessage } from '../../helpers/errorMessages'

const logger = withLogger('CmsContentApi')

@Service()
export class CmsContentApi {
  public constructor(
    private readonly fetchWrapper: FetchWrapper,
    @Inject(DiKeys.CmsApiUrl)
    private readonly baseUrl: string,
  ) {}

  public async getLessonMaterials(
    lessonPlanId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<ContentDto>> {
    if (!authenticationToken) {
      throw new Error(ErrorMessage.authenticationTokenUndefined)
    }
    const requestUrl = `${this.baseUrl}/contents?plan_id=${lessonPlanId}`

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

    return dtos
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

    return dtos
  }
}
