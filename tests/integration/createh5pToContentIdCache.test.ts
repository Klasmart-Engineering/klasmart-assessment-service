import { expect } from 'chai'
import { LessonMaterialBuilder, LessonPlanBuilder } from '../builders'
import {
  dbConnect,
  dbDisconnect,
  dbSynchronize,
} from '../utils/globalIntegrationTestHooks'
import {
  createH5pIdToCmsContentIdCache,
  h5pIdToCmsContentIdCache,
} from '../../src/helpers/getContent'
import { FileType } from '../../src/db/cms/enums'
import { throwExpression } from '../../src/helpers/throwExpression'
import Substitute from '@fluffy-spoon/substitute'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'

describe('createH5pIdToCmsContentIdCache', function () {
  before(async () => await dbConnect())
  after(async () => await dbDisconnect())
  afterEach(async () => await dbSynchronize())

  context(
    '1 published h5p material, 1 draft h5p material, 1 published pdf material, 1 lesson plan',
    () => {
      it('h5pIdToCmsContentIdCache is populated with only the published h5p material', async () => {
        // Arrange
        const lessonMaterial1 = new LessonMaterialBuilder()
          .withPublishStatus('draft')
          .build()
        const lessonMaterial2 = new LessonMaterialBuilder()
          .withPublishStatus('published')
          .withSource(FileType.H5P, lessonMaterial1.h5pId)
          .build()
        const lessonMaterial3 = new LessonMaterialBuilder()
          .withPublishStatus('published')
          .withSource(FileType.Document)
          .build()
        const lessonMaterial4 = new LessonMaterialBuilder()
          .withPublishStatus('hidden')
          .withSource(FileType.H5P, lessonMaterial1.h5pId)
          .build()
        const cmsContentProvider = Substitute.for<CmsContentProvider>()
        cmsContentProvider
          .getAllLessonMaterials()
          .resolves([
            lessonMaterial1,
            lessonMaterial2,
            lessonMaterial3,
            lessonMaterial4,
          ])

        // Act
        await createH5pIdToCmsContentIdCache(cmsContentProvider)

        // Assert
        expect(h5pIdToCmsContentIdCache).to.have.lengthOf(1)
        const h5pId =
          lessonMaterial2.h5pId ?? throwExpression('h5pId cannot be undefined')
        expect(h5pIdToCmsContentIdCache).to.have.all.keys(h5pId)
      })
    },
  )
})
