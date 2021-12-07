import fetch, { Response } from 'node-fetch'
import { Service } from 'typedi'
import { withLogger } from 'kidsloop-nodejs-logger'
import ContentResponse, { ContentDto } from './contentResponse'
import { throwExpression } from '../../helpers/throwExpression'

const logger = withLogger('CmsContentApi')

@Service()
export class CmsContentApi {
  public async getLessonMaterials(
    lessonPlanId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<ContentDto>> {
    // TODO: Think about moving this check to the source (fail early).
    if (!authenticationToken) {
      throw new Error(
        `[CmsContentApi.getLessonMaterials] authenticationToken is undefined.`,
      )
    }
    const cmsApiUrl =
      process.env.CMS_API_URL ?? throwExpression('CMS_API_URL is undefined')
    const contentsApiUrl = `${cmsApiUrl}/contents?plan_id=${lessonPlanId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
      headers: {
        cookie: `access=${authenticationToken}`,
      },
    })

    const response = await fetchPromise
    if (!response.ok) {
      logger.error(
        `getLessonMaterials failed. response status: ${response.status}.`,
      )
      return []
    }
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<ContentDto | undefined> {
    // TODO: Think about moving this check to the source (fail early).
    if (!authenticationToken) {
      throw new Error(
        `[CmsContentApi.getLessonMaterial] authenticationToken is undefined.`,
      )
    }
    const cmsApiUrl =
      process.env.CMS_API_URL ?? throwExpression('CMS_API_URL is undefined')
    const contentsApiUrl = `${cmsApiUrl}/contents?content_ids=${contentId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
      headers: {
        cookie: `access=${authenticationToken}`,
      },
    })

    const response = await fetchPromise
    if (!response.ok) {
      logger.error(
        `getLessonMaterial failed. response status: ${response.status}.`,
      )
      return undefined
    }
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []
    if (contentDtos.length === 0) {
      return undefined
    }

    return contentDtos[0]
  }

  public async getLessonMaterialsWithSourceId(
    sourceId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<ContentDto>> {
    // TODO: Think about moving this check to the source (fail early).
    if (!authenticationToken) {
      throw new Error(
        `[CmsContentApi.getLessonMaterialsWithSourceId] authenticationToken is undefined.`,
      )
    }
    const cmsApiUrl =
      process.env.CMS_API_URL ?? throwExpression('CMS_API_URL is undefined')
    const contentsApiUrl = `${cmsApiUrl}/contents?source_id=${sourceId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
      headers: {
        cookie: `access=${authenticationToken}`,
      },
    })

    const response = await fetchPromise
    if (!response.ok) {
      logger.error(
        `getLessonMaterialsWithSourceId failed. response status: ${response.status}.`,
      )
      return []
    }
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }
}
