import 'reflect-metadata'
import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { FetchWrapper } from '../../../src/web/fetchWrapper'
import { EndUserBuilder } from '../../builders'
import { throwExpression } from '../../../src/helpers/throwExpression'
import { ErrorMessage } from '../../../src/helpers/errorMessages'
import {
  H5pContentApi,
  H5pInfoDto,
  H5PInfoResponse,
} from '../../../src/web/h5p'

describe('h5pContentApi', () => {
  describe('getH5pContents', () => {
    context('1 content requested which exists', () => {
      it('returns matching content', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const h5pIds = ['6099c496e05f6e940027387c']
        const h5pIdCsv = '6099c496e05f6e940027387c'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new H5pContentApi(networkRequestProvider, baseUrl)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        const requestUrl = `${baseUrl}/content_info?contentIds=${h5pIdCsv}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(h5pResponse)

        // Act
        const result = await sut.getH5pContents(h5pIds, authenticationToken)

        // Assert
        expect(result).to.deep.equal(h5pResponse)
      })
    })

    context('response is undefined', () => {
      it('throws content error', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const h5pIds = ['6099c496e05f6e940027387c']
        const h5pIdCsv = '6099c496e05f6e940027387c'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new H5pContentApi(networkRequestProvider, baseUrl)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        const requestUrl = `${baseUrl}/content_info?contentIds=${h5pIdCsv}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(undefined)

        // Act
        const fn = () => sut.getH5pContents(h5pIds, authenticationToken)

        // Assert
        await expect(fn()).to.be.rejectedWith('[H5pContentApi] Request failed.')
      })
    })

    context('authentication token is undefined', () => {
      it('throws authentication token error', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const h5pIds = ['6099c496e05f6e940027387c']
        const h5pIdCsv = '6099c496e05f6e940027387c'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new H5pContentApi(networkRequestProvider, baseUrl)

        const authenticationToken = undefined
        const requestUrl = `${baseUrl}/content_info?contentIds=${h5pIdCsv}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(h5pResponse)

        // Act
        const fn = () => sut.getH5pContents(h5pIds, authenticationToken)

        // Assert
        expect(fn()).to.be.rejectedWith(
          ErrorMessage.authenticationTokenUndefined,
        )
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
