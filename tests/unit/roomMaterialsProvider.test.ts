import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { RoomMaterialsProvider } from '../../src/providers/roomMaterialsProvider'
import {
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
} from '../builders'
import { Repository } from 'typeorm'
import { Content, Schedule } from '../../src/db/cms/entities'
import { LessonPlan } from '../../src/db/cms/entities/lessonPlan'
import { CmsScheduleProvider } from '../../src/providers/cmsScheduleProvider'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'

describe('roomMaterialsProvider', () => {
  context('1 LessonPlan with 1 Material, 1 matching Schedule', () => {
    it('returns 1 Material', async () => {
      // Arrange
      const roomId = 'room1'

      const material = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder()
        .addMaterialId(material.contentId)
        .build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()

      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      const cmsContentProvider = Substitute.for<CmsContentProvider>()

      cmsScheduleProvider.getSchedule(Arg.any()).resolves(schedule)
      cmsContentProvider.getLessonMaterials(Arg.any()).resolves([material])

      const sut = new RoomMaterialsProvider(
        cmsScheduleProvider,
        cmsContentProvider,
      )

      // Act
      const resultMaterials = await sut.getMaterials(roomId)

      // Assert
      expect(resultMaterials).to.have.lengthOf(1)
      expect(resultMaterials[0]).to.deep.equal(material)
    })
  })
})
