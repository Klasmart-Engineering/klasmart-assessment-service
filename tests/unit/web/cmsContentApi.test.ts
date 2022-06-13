import 'reflect-metadata'
import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { CmsContentApi, ContentDto } from '../../../src/web'
import { FetchWrapper } from '../../../src/web/fetchWrapper'
import { throwExpression } from '../../../src/helpers/throwExpression'
import { EndUserBuilder } from '../../builders'
import ContentResponse from '../../../src/web/cms/contentResponse'
import { ErrorMessage } from '../../../src/helpers/errorMessages'

describe('cmsContentApi', () => {
  describe('getLessonMaterials', () => {
    context('1 lesson material exists matching provided roomId', () => {
      it('returns 1 matching lesson material', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsContentApi(networkRequestProvider, baseUrl)

        const roomId = 'room1'
        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        const requestUrl = `${baseUrl}/contents?schedule_id=${roomId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(contentResponse)

        // Act
        const response = await sut.getLessonMaterials(
          roomId,
          authenticationToken,
        )

        // Assert
        expect(response.list).to.have.lengthOf(1)
        expect(response.list[0]).to.deep.equal(contentDto)
      })
    })

    context('authentication token is undefined', () => {
      it('throws authentication token error', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsContentApi(networkRequestProvider, baseUrl)

        const lessonPlanId = 'plan1'
        const authenticationToken = undefined
        const requestUrl = `${baseUrl}/contents?plan_id=${lessonPlanId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(contentResponse)

        // Act
        const fn = () =>
          sut.getLessonMaterials(lessonPlanId, authenticationToken)

        // Assert
        expect(fn()).to.be.rejectedWith(
          ErrorMessage.authenticationTokenUndefined,
        )
      })
    })
  })

  describe('getLessonMaterial', () => {
    context('provided contentId exists', () => {
      it('returns expected lesson material', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsContentApi(networkRequestProvider, baseUrl)

        const lessonMaterialId = '6099c28a1f42c08c3e3d447e'
        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        const requestUrl = `${baseUrl}/contents?content_ids=${lessonMaterialId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(contentResponse)

        // Act
        const result = await sut.getLessonMaterial(
          lessonMaterialId,
          authenticationToken,
        )

        // Assert
        expect(result).to.deep.equal(contentDto)
      })
    })

    context('authentication token is undefined', () => {
      it('throws authentication token error', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsContentApi(networkRequestProvider, baseUrl)

        const lessonMaterialId = '6099c28a1f42c08c3e3d447e'
        const authenticationToken = undefined
        const requestUrl = `${baseUrl}/contents?content_ids=${lessonMaterialId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(contentResponse)

        // Act
        const fn = () =>
          sut.getLessonMaterial(lessonMaterialId, authenticationToken)

        // Assert
        expect(fn()).to.be.rejectedWith(
          ErrorMessage.authenticationTokenUndefined,
        )
      })
    })
  })

  describe('getLessonMaterialsWithSourceId', () => {
    context('material with provided sourceId exists', () => {
      it('returns expected lesson materials', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsContentApi(networkRequestProvider, baseUrl)

        const sourceId = '6099c2832069df0014dc34cb'
        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        const requestUrl = `${baseUrl}/contents?source_id=${sourceId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(contentResponse)

        // Act
        const results = await sut.getLessonMaterialsWithSourceId(
          sourceId,
          authenticationToken,
        )

        // Assert
        expect(results).to.have.lengthOf(1)
        expect(results[0]).to.deep.equal(contentDto)
      })
    })

    context('authentication token is undefined', () => {
      it('throws authentication token error', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsContentApi(networkRequestProvider, baseUrl)

        const sourceId = '6099c2832069df0014dc34cb'
        const authenticationToken = undefined
        const requestUrl = `${baseUrl}/contents?source_id=${sourceId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(contentResponse)

        // Act
        const fn = () =>
          sut.getLessonMaterialsWithSourceId(sourceId, authenticationToken)

        // Assert
        expect(fn()).to.be.rejectedWith(
          ErrorMessage.authenticationTokenUndefined,
        )
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
