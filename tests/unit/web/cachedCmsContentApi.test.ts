import 'reflect-metadata'
import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { EndUserBuilder } from '../../builders'
import { throwExpression } from '../../../src/helpers/throwExpression'
import { InMemoryCache } from '../../../src/cache'
import { CmsContentApi, ContentDto } from '../../../src/web'
import ContentResponse from '../../../src/web/cms/contentResponse'
import {
  CachedCmsContentApi,
  getLessonMaterialKey,
  getLessonMaterialsKey,
} from '../../../src/web/cms/cachedCmsContentApi'

describe('cachedCmsContentApi', () => {
  describe('getLessonMaterials', () => {
    context('1 content requested which exists; not cached', () => {
      it('returns matching content; calls cmsContentApi; result saved in cache', async () => {
        // Arrange
        const roomId = 'room1'
        const cmsContentApi = Substitute.for<CmsContentApi>()
        const cache = new InMemoryCache(Date)
        const sut = new CachedCmsContentApi(cmsContentApi, cache)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        cmsContentApi
          .getLessonMaterials(roomId, authenticationToken)
          .resolves(contentResponse)

        // Act
        const result = await sut.getLessonMaterials(roomId, authenticationToken)

        // Assert
        expect(result).to.deep.equal(contentResponse)
        cmsContentApi.received(1).getLessonMaterials(Arg.all())
        const cached = await cache.get(getLessonMaterialsKey(roomId))
        expect(cached).to.equal(JSON.stringify(contentResponse))
      })
    })

    context('1 content requested which exists; result is cached', () => {
      it('returns matching content; does not call cmsContentApi; result still saved in cache', async () => {
        // Arrange
        const roomId = 'room1'
        const cmsContentApi = Substitute.for<CmsContentApi>()
        const cache = new InMemoryCache(Date)
        const sut = new CachedCmsContentApi(cmsContentApi, cache)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        cmsContentApi
          .getLessonMaterials(roomId, authenticationToken)
          .resolves(contentResponse)
        await cache.set(
          getLessonMaterialsKey(roomId),
          JSON.stringify(contentResponse),
          60,
        )

        // Act
        const result = await sut.getLessonMaterials(roomId, authenticationToken)

        // Assert
        expect(result).to.deep.equal(contentResponse)
        cmsContentApi.received(0).getLessonMaterials(Arg.all())
        const cached = await cache.get(getLessonMaterialsKey(roomId))
        expect(cached).to.equal(JSON.stringify(contentResponse))
      })
    })
  })

  describe('getLessonMaterial', () => {
    context('1 content requested which exists; not cached', () => {
      it('returns matching content; calls cmsContentApi; result saved in cache', async () => {
        // Arrange
        const contentId = 'content1'
        const cmsContentApi = Substitute.for<CmsContentApi>()
        const cache = new InMemoryCache(Date)
        const sut = new CachedCmsContentApi(cmsContentApi, cache)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        cmsContentApi
          .getLessonMaterial(contentId, authenticationToken)
          .resolves(contentDto)

        // Act
        const result = await sut.getLessonMaterial(
          contentId,
          authenticationToken,
        )

        // Assert
        expect(result).to.deep.equal(contentDto)
        cmsContentApi.received(1).getLessonMaterial(Arg.all())
        const cached = await cache.get(getLessonMaterialKey(contentId))
        expect(cached).to.equal(JSON.stringify(contentDto))
      })
    })

    context('1 content requested which exists; result is cached', () => {
      it('returns matching content; does not call cmsContentApi; result still saved in cache', async () => {
        // Arrange
        const contentId = 'content1'
        const cmsContentApi = Substitute.for<CmsContentApi>()
        const cache = new InMemoryCache(Date)
        const sut = new CachedCmsContentApi(cmsContentApi, cache)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        cmsContentApi
          .getLessonMaterial(contentId, authenticationToken)
          .resolves(contentDto)
        await cache.set(
          getLessonMaterialKey(contentId),
          JSON.stringify(contentDto),
          60,
        )

        // Act
        const result = await sut.getLessonMaterial(
          contentId,
          authenticationToken,
        )

        // Assert
        expect(result).to.deep.equal(contentDto)
        cmsContentApi.received(0).getLessonMaterial(Arg.all())
        const cached = await cache.get(getLessonMaterialKey(contentId))
        expect(cached).to.equal(JSON.stringify(contentDto))
      })
    })
  })
})

const studentId = 'student1'

const contentDto: ContentDto = {
  id: '6099c28a1f42c08c3e3d447e',
  author_id: '80affb9c-94f3-4d32-9ec8-ddcf8d70b9ec',
  content_name: 'LM',
  content_type: 1,
  create_at: 1620689546,
  data: '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
  publish_status: 'published',
}

const contentResponse: ContentResponse = {
  total: 1,
  list: [contentDto],
  student_content_map: [
    {
      student_id: studentId,
      content_ids: [
        contentDto.id ?? throwExpression('contentDto.id is undefined'),
      ],
    },
  ],
}
