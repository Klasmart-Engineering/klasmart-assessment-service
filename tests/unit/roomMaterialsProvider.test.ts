import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { RoomMaterialsProvider } from '../../src/helpers/roomMaterialsProvider'
import {
  LessonMaterialBuilder,
  LessonPlanBuilder,
  ScheduleBuilder,
} from '../builders'
import { Repository } from 'typeorm'
import { Content, Schedule } from '../../src/db/cms/entities'
import { LessonPlan } from '../../src/db/cms/entities/lessonPlan'
import { ILogger, Logger } from '../../src/helpers/logger'

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

      const scheduleRepository = Substitute.for<Repository<Schedule>>()
      const contentRepository = Substitute.for<Repository<Content>>()
      const lessonPlanRepository = Substitute.for<Repository<LessonPlan>>()

      scheduleRepository.findOne(Arg.any()).resolves(schedule)
      lessonPlanRepository.findOne(Arg.any()).resolves(lessonPlan)
      contentRepository.find(Arg.any()).resolves([material])

      const sut = new RoomMaterialsProvider(
        scheduleRepository,
        contentRepository,
        lessonPlanRepository,
      )

      // Act
      const resultMaterials = await sut.getMaterials(roomId)

      // Assert
      expect(resultMaterials).to.have.lengthOf(1)
      expect(resultMaterials[0]).to.deep.equal(material)
    })
  })

  context('material not included in lesson plan', () => {
    it('returns an empty list of materials', async () => {
      // Arrange
      const roomId = 'room1'
      const logger = Substitute.for<ILogger>()
      Logger.register(() => logger)

      const material = new LessonMaterialBuilder().build()
      const lessonPlan = new LessonPlanBuilder().build()
      const schedule = new ScheduleBuilder()
        .withRoomId(roomId)
        .withLessonPlanId(lessonPlan.contentId)
        .build()

      const scheduleRepository = Substitute.for<Repository<Schedule>>()
      const contentRepository = Substitute.for<Repository<Content>>()
      const lessonPlanRepository = Substitute.for<Repository<LessonPlan>>()

      scheduleRepository.findOne(Arg.any()).resolves(schedule)
      lessonPlanRepository.findOne(Arg.any()).resolves(undefined)
      contentRepository.find(Arg.any()).resolves([material])

      const sut = new RoomMaterialsProvider(
        scheduleRepository,
        contentRepository,
        lessonPlanRepository,
      )

      // Act
      const resultMaterials = await sut.getMaterials(roomId)

      // Assert
      expect(resultMaterials).to.be.empty
      // TODO: Specify exact text.
      logger.received(1).warn(Arg.any())
    })
  })
})
