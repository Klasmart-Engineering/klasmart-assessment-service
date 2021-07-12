import { expect } from 'chai'
import { v4 } from 'uuid'
import { FileType } from '../../src/db/cms/enums'
import { LessonPlanBuilder, LessonMaterialBuilder } from '../builders'

describe('lessonPlan.populateMaterialIds', () => {
  context('data contains 1 material id', () => {
    it('materialIds contains 1 matching material id', () => {
      const materialId = v4()
      const builder = new LessonPlanBuilder().addMaterialId(materialId)
      const lessonPlan = builder.build()
      expect(lessonPlan.materialIds).to.be.empty
      lessonPlan['populateMaterialIds']()
      expect(lessonPlan.materialIds).to.have.lengthOf(1)
      expect(lessonPlan.materialIds[0]).to.equal(materialId)
    })
  })

  context('data is undefined', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonPlanBuilder().withUndefinedData()
      const lessonPlan = builder.build()
      lessonPlan['populateMaterialIds']()
      expect(lessonPlan.materialIds).to.be.empty
    })
  })
})
