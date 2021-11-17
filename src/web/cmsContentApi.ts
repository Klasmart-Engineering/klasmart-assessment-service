import fetch from 'node-fetch'
import { Service } from 'typedi'
import ContentResponse, { ContentDto } from './contentResponse'

@Service()
export class CmsContentApi {
  public async getLessonMaterials(lessonPlanId: string): Promise<ContentDto[]> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?plan_id=${lessonPlanId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
    })

    const response = await fetchPromise
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }

  public async getAllLessonMaterials(): Promise<ContentDto[]> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?content_type=1`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
    })

    const response = await fetchPromise
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }

  public async getLessonMaterial(
    contentId: string,
  ): Promise<ContentDto | undefined> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?content_ids=${contentId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
    })

    const response = await fetchPromise
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos[0]
  }

  public async getLessonMaterialsWithSourceId(
    sourceId: string,
  ): Promise<ContentDto[]> {
    const cmsApiUrl =
      process.env.CMS_API_URL || 'https://cms.alpha.kidsloop.net/v1/internal'
    const contentsApiUrl = `${cmsApiUrl}/contents?source_id=${sourceId}`

    const fetchPromise = fetch(contentsApiUrl, {
      method: 'GET',
    })

    const response = await fetchPromise
    const body = await response.json()
    const contentResponse = body as ContentResponse
    const contentDtos = contentResponse?.list ?? []

    return contentDtos
  }
}
