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
import { throwExpression } from '../utils/throwExpression'

describe('createH5pIdToCmsContentIdCache', function () {
  before(async () => await dbConnect())
  after(async () => await dbDisconnect())
  afterEach(async () => await dbSynchronize())

  context(
    '1 published h5p material, 1 draft h5p material, 1 published pdf material, 1 lesson plan',
    () => {
      it('h5pIdToCmsContentIdCache is populated with the 2 lesson materials', async () => {
        // Arrange
        const lessonMaterial1 = await new LessonMaterialBuilder()
          .withPublishStatus('draft')
          .buildAndPersist()
        const lessonMaterial2 = await new LessonMaterialBuilder()
          .withPublishStatus('published')
          .withSource(FileType.H5P, lessonMaterial1.h5pId)
          .buildAndPersist()
        const lessonMaterial3 = await new LessonMaterialBuilder()
          .withPublishStatus('published')
          .withSource(FileType.Document)
          .buildAndPersist()
        const lessonMaterial4 = await new LessonMaterialBuilder()
          .withPublishStatus('hidden')
          .withSource(FileType.H5P, lessonMaterial1.h5pId)
          .buildAndPersist()
        const lessonPlan = await new LessonPlanBuilder().buildAndPersist()

        // Act
        await createH5pIdToCmsContentIdCache()

        // Assert
        expect(h5pIdToCmsContentIdCache).to.have.lengthOf(1)
        const h5pId =
          lessonMaterial2.h5pId ?? throwExpression('h5pId cannot be undefined')
        expect(h5pIdToCmsContentIdCache).to.have.all.keys(h5pId)
      })
    },
  )
})
