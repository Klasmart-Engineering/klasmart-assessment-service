import { Inject, Service } from 'typedi'
import ContentResponse, { ContentDto } from './contentResponse'
import { CmsContentApi } from './cmsContentApi'
import { ICache } from '../../cache'
import DiKeys from '../../initialization/diKeys'

export const getLessonMaterialsKey = (key: string) =>
  `getLessonMaterials:${key}`
export const getLessonMaterialKey = (key: string) => `getLessonMaterial:${key}`

@Service()
export class CachedCmsContentApi {
  public constructor(
    private readonly cmsContentApi: CmsContentApi,
    @Inject(DiKeys.ICache)
    private readonly cache: ICache,
    private readonly ttlSeconds = 24 * 60 * 60,
  ) {}

  public async getLessonMaterials(
    roomId: string,
    authenticationToken?: string,
  ): Promise<ContentResponse> {
    const key = getLessonMaterialsKey(roomId)
    const cached = await this.cache.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    const response = await this.cmsContentApi.getLessonMaterials(
      roomId,
      authenticationToken,
    )
    if (response) {
      const json = JSON.stringify(response)
      await this.cache.set(key, json, this.ttlSeconds)
    }

    return response
  }

  public async getLessonMaterial(
    contentId: string,
    authenticationToken?: string,
  ): Promise<ContentDto | undefined> {
    const key = getLessonMaterialKey(contentId)
    const cached = await this.cache.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    const dto = await this.cmsContentApi.getLessonMaterial(
      contentId,
      authenticationToken,
    )
    if (dto) {
      const json = JSON.stringify(dto)
      await this.cache.set(key, json, this.ttlSeconds)
    }

    return dto
  }
}
