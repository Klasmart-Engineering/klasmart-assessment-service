import { expect } from 'chai'
import { LessonMaterialBuilder } from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { v4 } from 'uuid'
import { FileType } from '../../src/db/cms/enums'
import getContent, {
  h5pIdToCmsContentIdCache,
} from '../../src/helpers/getContent'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'

describe('getContent', function () {
  context(
    'contentKey does not correspond to a content, no entry in the h5pIdToContentIdCache',
    () => {
      it('return null content', async () => {
        // Arrange
        await dbConnect()
        const contentKey = v4()
        const contentType = undefined
        const contentName = undefined
        const contentParentId = undefined
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterial(contentKey).resolves(undefined)
        cmsContentProvider
          .getLessonMaterialsWithSourceId(Arg.any())
          .resolves([])

        // Act
        const result = await getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
          cmsContentProvider,
        )

        // Assert
        expect(result).to.be.null
      })

      after(async () => await dbDisconnect())
    },
  )

  context(
    'contentKey does not correspond to a content, contentKey entry exists in the h5pIdToContentIdCache but the content does not exist',
    () => {
      it('return null content', async () => {
        // Arrange
        await dbConnect()
        const contentKey = v4()
        const contentId = v4()
        const contentType = undefined
        const contentName = undefined
        const contentParentId = undefined
        h5pIdToCmsContentIdCache.set(contentKey, contentId)
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterial(contentKey).resolves(undefined)
        cmsContentProvider.getLessonMaterial(contentId).resolves(undefined)

        // Act
        const result = await getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
          cmsContentProvider,
        )

        // Assert
        expect(result).to.be.null
      })

      after(async () => await dbDisconnect())
    },
  )

  context(
    'provided contentKey uses h5pId, not cached, material publishStatus is hidden',
    () => {
      it('returns matching material', async () => {
        // Arrange
        await dbConnect()
        const contentKey = v4()
        const contentType = undefined
        const contentName = undefined
        const contentParentId = undefined
        const material = new LessonMaterialBuilder()
          .withPublishStatus('hidden')
          .withSource(FileType.H5P, contentKey)
          .build()
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider.getLessonMaterial(contentKey).resolves(undefined)
        cmsContentProvider
          .getLessonMaterialsWithSourceId(material.h5pId!)
          .resolves([material])

        // Act
        const result = await getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
          cmsContentProvider,
        )

        // Assert
        expect(result?.contentId).to.equal(material.contentId)
      })

      after(async () => await dbDisconnect())
    },
  )
})
