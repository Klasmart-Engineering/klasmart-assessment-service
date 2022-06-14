import 'reflect-metadata'
import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { EndUserBuilder } from '../../builders'
import { throwExpression } from '../../../src/helpers/throwExpression'
import {
  H5pContentApi,
  H5pInfoDto,
  H5PInfoResponse,
} from '../../../src/web/h5p'
import {
  CachedH5pContentApi,
  getH5pContentsKey,
} from '../../../src/web/h5p/cachedH5pContentApi'
import { InMemoryCache } from '../../../src/cache'

describe('cachedH5pContentApi', () => {
  describe('getH5pContents', () => {
    context('1 content requested which exists; not cached', () => {
      it('returns matching content; calls h5pContentApi; result saved in cache', async () => {
        // Arrange
        const h5pIds = ['6099c496e05f6e940027387c']
        const h5pId = '6099c496e05f6e940027387c'
        const h5pContentApi = Substitute.for<H5pContentApi>()
        const cache = new InMemoryCache(Date)
        const sut = new CachedH5pContentApi(h5pContentApi, cache)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        h5pContentApi
          .getH5pContents(h5pIds, authenticationToken)
          .resolves(h5pResponse)

        // Act
        const result = await sut.getH5pContents(h5pIds, authenticationToken)

        // Assert
        expect(result).to.deep.equal(h5pResponse)
        h5pContentApi.received(1).getH5pContents(Arg.all())
        const cached = await cache.get(getH5pContentsKey(h5pId))
        expect(cached).to.equal(JSON.stringify(h5pResponse))
      })
    })

    context('1 content requested which exists; result is cached', () => {
      it('returns matching content; does not call h5pContentApi; result still saved in cache', async () => {
        // Arrange
        const h5pIds = ['6099c496e05f6e940027387c']
        const h5pId = '6099c496e05f6e940027387c'
        const h5pContentApi = Substitute.for<H5pContentApi>()
        const cache = new InMemoryCache(Date)
        const sut = new CachedH5pContentApi(h5pContentApi, cache)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        h5pContentApi
          .getH5pContents(h5pIds, authenticationToken)
          .resolves(h5pResponse)
        await cache.set(
          getH5pContentsKey(h5pId),
          JSON.stringify(h5pResponse),
          60,
        )

        // Act
        const result = await sut.getH5pContents(h5pIds, authenticationToken)

        // Assert
        expect(result).to.deep.equal(h5pResponse)
        h5pContentApi.received(0).getH5pContents(Arg.all())
        const cached = await cache.get(getH5pContentsKey(h5pId))
        expect(cached).to.equal(JSON.stringify(h5pResponse))
      })
    })
  })
})

const h5pInfoDto: H5pInfoDto = {
  id: '6099c496e05f6e940027387c',
  name: 'My CP',
  type: 'CoursePresentationKID',
  subContents: [
    {
      id: '6099c3111f42c08c3e3d44d2',
      name: 'My Flashcards',
      type: 'Flashcards',
    },
  ],
}

const h5pResponse: H5PInfoResponse = {
  contents: [h5pInfoDto],
}
