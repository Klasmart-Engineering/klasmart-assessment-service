import 'reflect-metadata'
import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
import { CmsContentApi, ContentDto } from '../../src/web'
import { Content } from '../../src/db/cms/entities'
import { delay } from '../../src/helpers/delay'

describe('cmsContentProvider', () => {
  let intervalId: NodeJS.Timeout | undefined

  afterEach(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  describe('getLessonMaterials', () => {
    context(
      '1 lesson material exists matching provided lessonPlanId; first time access',
      () => {
        it('returns 1 matching lesson material; cache miss', async () => {
          // Arrange
          const lessonPlanId = 'plan1'
          const cmsContentApi = Substitute.for<CmsContentApi>()
          cmsContentApi.getLessonMaterials(lessonPlanId).resolves([contentDto1])
          const sut = new CmsContentProvider(cmsContentApi)
          intervalId = sut.setRecurringCacheClear(100)

          // Act
          const results = await sut.getLessonMaterials(lessonPlanId)

          // Assert
          expect(results).to.have.lengthOf(1)
          expect(results[0]).to.deep.equal(content1)
          cmsContentApi.received(1).getLessonMaterials(Arg.any())
        })
      },
    )

    context(
      '1 lesson material exists matching provided lessonPlanId; second access; within cache duration',
      () => {
        it('returns 1 matching lesson material; cache hit', async () => {
          // Arrange
          const lessonPlanId = 'plan1'
          const cmsContentApi = Substitute.for<CmsContentApi>()
          cmsContentApi.getLessonMaterials(lessonPlanId).resolves([contentDto1])
          const sut = new CmsContentProvider(cmsContentApi)
          intervalId = sut.setRecurringCacheClear(100)

          // Act
          const results1 = await sut.getLessonMaterials(lessonPlanId)
          cmsContentApi.clearSubstitute()
          cmsContentApi.getLessonMaterials(lessonPlanId).resolves([contentDto1])
          const results2 = await sut.getLessonMaterials(lessonPlanId)

          // Assert
          expect(results2).to.have.lengthOf(1)
          expect(results2[0]).to.deep.equal(content1)
          cmsContentApi.didNotReceive().getLessonMaterials(Arg.any())
        })
      },
    )

    context(
      '1 lesson material exists matching provided lessonPlanId; second access; outside of cache duration',
      () => {
        it('returns 1 matching lesson material; cache miss', async () => {
          // Arrange
          const lessonPlanId = 'plan1'
          const cmsContentApi = Substitute.for<CmsContentApi>()
          cmsContentApi.getLessonMaterials(lessonPlanId).resolves([contentDto1])
          const sut = new CmsContentProvider(cmsContentApi)
          intervalId = sut.setRecurringCacheClear(100)

          // Act
          const results1 = await sut.getLessonMaterials(lessonPlanId)
          cmsContentApi.clearSubstitute()
          cmsContentApi.getLessonMaterials(lessonPlanId).resolves([contentDto1])
          await delay(100)
          const results2 = await sut.getLessonMaterials(lessonPlanId)

          // Assert
          expect(results2).to.have.lengthOf(1)
          expect(results2[0]).to.deep.equal(content1)
          cmsContentApi.received(1).getLessonMaterials(Arg.any())
        })
      },
    )
  })

  describe('getLessonMaterial', () => {
    context('1 matching lesson material exists; first time access', () => {
      it('returns matching lesson material; cache miss', async () => {
        // Arrange
        const lessonMaterialId = content1.contentId
        const cmsContentApi = Substitute.for<CmsContentApi>()
        cmsContentApi.getLessonMaterial(lessonMaterialId).resolves(contentDto1)
        const sut = new CmsContentProvider(cmsContentApi)
        intervalId = sut.setRecurringCacheClear(100)

        // Act
        const result = await sut.getLessonMaterial(lessonMaterialId)

        // Assert
        expect(result).to.deep.equal(content1)
        cmsContentApi.received(1).getLessonMaterial(Arg.any())
      })
    })

    context(
      '1 matching lesson material exists; second access; within cache duration',
      () => {
        it('returns matching lesson material; cache hit', async () => {
          // Arrange
          const lessonMaterialId = content1.contentId
          const cmsContentApi = Substitute.for<CmsContentApi>()
          cmsContentApi
            .getLessonMaterial(lessonMaterialId)
            .resolves(contentDto1)
          const sut = new CmsContentProvider(cmsContentApi)
          intervalId = sut.setRecurringCacheClear(100)

          // Act
          const result1 = await sut.getLessonMaterial(lessonMaterialId)
          cmsContentApi.clearSubstitute()
          cmsContentApi
            .getLessonMaterial(lessonMaterialId)
            .resolves(contentDto1)
          const result2 = await sut.getLessonMaterial(lessonMaterialId)

          // Assert
          expect(result2).to.deep.equal(content1)
          cmsContentApi.didNotReceive().getLessonMaterial(Arg.any())
        })
      },
    )

    context(
      '1 matching lesson material exists; second access; outside of cache duration',
      () => {
        it('returns matching lesson material; cache miss', async () => {
          // Arrange
          const lessonMaterialId = content1.contentId
          const cmsContentApi = Substitute.for<CmsContentApi>()
          cmsContentApi
            .getLessonMaterial(lessonMaterialId)
            .resolves(contentDto1)
          const sut = new CmsContentProvider(cmsContentApi)
          intervalId = sut.setRecurringCacheClear(100)

          // Act
          const result1 = await sut.getLessonMaterial(lessonMaterialId)
          cmsContentApi.clearSubstitute()
          cmsContentApi
            .getLessonMaterial(lessonMaterialId)
            .resolves(contentDto1)
          await delay(100)
          const result2 = await sut.getLessonMaterial(lessonMaterialId)

          // Assert
          expect(result2).to.deep.equal(content1)
          cmsContentApi.received(1).getLessonMaterial(Arg.any())
        })
      },
    )

    context(
      '1 matching lesson material exists; called right after fetching by lessonPlanId; within cache duration',
      () => {
        it('returns matching lesson material; cache hit', async () => {
          // Arrange
          const lessonPlanId = 'plan1'
          const lessonMaterialId = content1.contentId
          const cmsContentApi = Substitute.for<CmsContentApi>()
          cmsContentApi.getLessonMaterials(lessonPlanId).resolves([contentDto1])
          cmsContentApi
            .getLessonMaterial(lessonMaterialId)
            .resolves(contentDto1)
          const sut = new CmsContentProvider(cmsContentApi)
          intervalId = sut.setRecurringCacheClear(200)

          // Act
          const lessonMaterialsForLessonPlan = await sut.getLessonMaterials(
            lessonPlanId,
          )
          const lessonMaterial = await sut.getLessonMaterial(lessonMaterialId)

          // Assert
          expect(lessonMaterial).to.deep.equal(content1)
          cmsContentApi.didNotReceive().getLessonMaterial(Arg.any())
        })
      },
    )
  })

  describe('getLessonMaterialsWithSourceId', () => {
    context('1 lesson material exists matching provided sourceId', () => {
      it('returns 1 matching lesson material', async () => {
        // Arrange
        const sourceId = 'source1'
        const cmsContentApi = Substitute.for<CmsContentApi>()
        cmsContentApi
          .getLessonMaterialsWithSourceId(sourceId)
          .resolves([contentDto1])
        const sut = new CmsContentProvider(cmsContentApi)

        // Act
        const results = await sut.getLessonMaterialsWithSourceId(sourceId)

        // Assert
        expect(results).to.have.lengthOf(1)
        expect(results[0]).to.deep.equal(content1)
      })
    })
  })
})

const contentDto1: ContentDto = {
  id: '6099c28a1f42c08c3e3d447e',
  author_id: '80affb9c-94f3-4d32-9ec8-ddcf8d70b9ec',
  content_name: 'LM',
  content_type: 1,
  create_at: 1620689546,
  data: '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
  publish_status: 'published',
}

const content1 = new Content(
  '6099c28a1f42c08c3e3d447e',
  '80affb9c-94f3-4d32-9ec8-ddcf8d70b9ec',
  'LM',
  1,
  1620689546,
  JSON.parse(
    '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
  ),
  'published',
)
