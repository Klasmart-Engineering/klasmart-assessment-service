import { expect } from 'chai'
import { CmsContentApi, ContentDto } from '../../src/web/cms'
import { FetchWrapper } from '../../src/web/fetchWrapper'

describe.skip('cmsContentApi', function () {
  const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'

  describe('getLessonMaterials', () => {
    context('provided lessonPlanId exists', () => {
      it('returns expected lesson materials', async () => {
        // Arrange
        const lessonPlanId = '6099c3111f42c08c3e3d44d2'
        const sut = new CmsContentApi(new FetchWrapper(), baseUrl)

        // Act
        const result = await sut.getLessonMaterials(lessonPlanId)

        // Assert
        const expected: ContentDto = {
          id: '6099c28a1f42c08c3e3d447e',
          author_id: '80affb9c-94f3-4d32-9ec8-ddcf8d70b9ec',
          content_name: 'LM',
          content_type: 1,
          create_at: 1620689546,
          data: '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
          publish_status: 'published',
        }
        expect(result.list).to.have.lengthOf(1)
        expect(result.list[0]).to.deep.includes(expected)
      })
    })
  })

  describe('getLessonMaterial', () => {
    context('provided contentId exists', () => {
      it('returns expected lesson material', async () => {
        // Arrange
        const lessonMaterialId = '6099c28a1f42c08c3e3d447e'
        const sut = new CmsContentApi(new FetchWrapper(), baseUrl)

        // Act
        const result = await sut.getLessonMaterial(lessonMaterialId)

        // Assert
        const expected: ContentDto = {
          id: '6099c28a1f42c08c3e3d447e',
          author_id: '80affb9c-94f3-4d32-9ec8-ddcf8d70b9ec',
          content_name: 'LM',
          content_type: 1,
          create_at: 1620689546,
          data: '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
          publish_status: 'published',
        }
        expect(result).to.deep.equal(expected)
      })
    })
  })

  describe('getLessonMaterialsWithSourceId', () => {
    context('material with provided sourceId exists', () => {
      it('returns expected lesson materials', async () => {
        // Arrange
        const sourceId = '6099c2832069df0014dc34cb'
        const sut = new CmsContentApi(new FetchWrapper(), baseUrl)

        // Act
        const result = await sut.getLessonMaterialsWithSourceId(sourceId)

        // Assert
        const expected: ContentDto = {
          id: '6099c28a1f42c08c3e3d447e',
          author_id: '80affb9c-94f3-4d32-9ec8-ddcf8d70b9ec',
          content_name: 'LM',
          content_type: 1,
          create_at: 1620689546,
          data: '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
          publish_status: 'published',
        }
        expect(result).to.have.lengthOf(1)
        expect(result[0]).to.deep.equal(expected)
      })
    })
  })
})
