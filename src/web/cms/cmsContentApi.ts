import fetch from 'node-fetch'
import { Service } from 'typedi'
import ContentResponse, { ContentDto } from './contentResponse'

@Service()
export class CmsContentApi {
  public async getLessonMaterials(
    lessonPlanId: string,
    authenticationToken?: string,
  ): Promise<ReadonlyArray<ContentDto>> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?plan_id=${lessonPlanId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
      headers: {
        cookie: authenticationToken ? `access=${authenticationToken}` : '',
      },
    })

    const response = await fetchPromise
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<ContentDto | undefined> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?content_ids=${contentId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
      headers: {
        cookie: authenticationToken ? `access=${authenticationToken}` : '',
      },
    })

    const response = await fetchPromise
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
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?source_id=${sourceId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
      headers: {
        cookie: authenticationToken ? `access=${authenticationToken}` : '',
      },
    })

    const response = await fetchPromise
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }
}
