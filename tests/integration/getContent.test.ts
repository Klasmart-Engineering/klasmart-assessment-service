import { expect } from 'chai'
import { LessonMaterialBuilder } from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities'
import { getRepository } from 'typeorm'
import { FileType } from '../../src/db/cms/enums'
import getContent, {
  h5pIdToCmsContentIdCache,
} from '../../src/helpers/getContent'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'

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

        // Act
        const result = await getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
          getRepository(Content, CMS_CONNECTION_NAME),
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

        // Act
        const result = await getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
          getRepository(Content, CMS_CONNECTION_NAME),
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
      it('returns mathing material', async () => {
        // Arrange
        await dbConnect()
        const contentKey = v4()
        const contentType = undefined
        const contentName = undefined
        const contentParentId = undefined
        const material = await new LessonMaterialBuilder()
          .withPublishStatus('hidden')
          .withSource(FileType.H5P, contentKey)
          .buildAndPersist()

        // Act
        const result = await getContent(
          contentKey,
          contentType,
          contentName,
          contentParentId,
          getRepository(Content, CMS_CONNECTION_NAME),
        )

        // Assert
        expect(result?.contentId).to.equal(material.contentId)
      })

      after(async () => await dbDisconnect())
    },
  )
})
