import { expect } from 'chai'
import { LessonMaterialBuilder } from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { v4 } from 'uuid'
import { FileType } from '../../src/db/cms/enums'
import ContentProvider from '../../src/helpers/getContent'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
import { throwExpression } from '../../src/helpers/throwExpression'

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
        const authenticationToken = undefined
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterial(contentKey, authenticationToken)
          .resolves(undefined)
        cmsContentProvider
          .getLessonMaterialsWithSourceId(contentKey, authenticationToken)
          .resolves([])
        const sut = new ContentProvider(cmsContentProvider)

        // Act
        const result = await sut.getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
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
        const authenticationToken = undefined
        const h5pIdToCmsContentIdCache = new Map<string, string>()
        h5pIdToCmsContentIdCache.set(contentKey, contentId)
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterial(contentKey, authenticationToken)
          .resolves(undefined)
        cmsContentProvider
          .getLessonMaterial(contentId, authenticationToken)
          .resolves(undefined)
        const sut = new ContentProvider(
          cmsContentProvider,
          h5pIdToCmsContentIdCache,
        )

        // Act
        const result = await sut.getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
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
        const authenticationToken = undefined
        const material = new LessonMaterialBuilder()
          .withPublishStatus('hidden')
          .withSource(FileType.H5P, contentKey)
          .build()
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getLessonMaterial(contentKey, authenticationToken)
          .resolves(undefined)
        cmsContentProvider
          .getLessonMaterialsWithSourceId(
            material.h5pId ?? throwExpression('h5pId is undefined'),
            authenticationToken,
          )
          .resolves([material])
        const sut = new ContentProvider(cmsContentProvider)

        // Act
        const result = await sut.getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
        )

        // Assert
        expect(result?.contentId).to.equal(material.contentId)
      })

      after(async () => await dbDisconnect())
    },
  )
})
