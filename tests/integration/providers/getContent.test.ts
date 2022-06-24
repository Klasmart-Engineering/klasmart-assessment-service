import { expect } from 'chai'
import { dbConnect, dbDisconnect } from '../../utils/globalIntegrationTestHooks'
import { v4 } from 'uuid'
import CustomizedContentProvider from '../../../src/providers/customizedContentProvider'
import Substitute from '@fluffy-spoon/substitute'
import { CmsContentProvider } from '../../../src/providers/cmsContentProvider'

// TODO: Rename this.
describe('getContent', function () {
  context('contentKey does not correspond to a content', () => {
    it('return null content', async () => {
      // Arrange
      await dbConnect()
      const contentKey = v4()
      const contentId = v4()
      const contentType = undefined
      const contentName = undefined
      const contentParentId = undefined
      const authenticationToken = undefined
      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      cmsContentProvider
        .getLessonMaterial(contentKey, authenticationToken)
        .resolves(undefined)
      cmsContentProvider
        .getLessonMaterial(contentId, authenticationToken)
        .resolves(undefined)
      const sut = new CustomizedContentProvider(cmsContentProvider)

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
  })
})
