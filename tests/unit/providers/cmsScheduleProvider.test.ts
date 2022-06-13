import 'reflect-metadata'
import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { ScheduleDto } from '../../../src/web'
import { Schedule } from '../../../src/db/cms/entities'
import { CmsScheduleProvider } from '../../../src/providers/cmsScheduleProvider'
import { CachedCmsScheduleApi } from '../../../src/web/cms/cachedCmsScheduleApi'

describe('cmsScheduleProvider', () => {
  describe('getSchedule', () => {
    context('1 matching schedule exists', () => {
      it('returns matching schedule', async () => {
        // Arrange
        const scheduleId = schedule.id
        const cmsScheduleApi = Substitute.for<CachedCmsScheduleApi>()
        cmsScheduleApi.getSchedule(scheduleId, Arg.any()).resolves(scheduleDto)
        const sut = new CmsScheduleProvider(cmsScheduleApi)

        // Act
        const result = await sut.getSchedule(scheduleId)

        // Assert
        expect(result).to.deep.equal(schedule)
        cmsScheduleApi.received(1).getSchedule(Arg.all())
      })
    })

    context('0 matching schedules exists', () => {
      it('returns undefined', async () => {
        // Arrange
        const scheduleId = 'schedule2'
        const cmsScheduleApi = Substitute.for<CachedCmsScheduleApi>()
        cmsScheduleApi.getSchedule(scheduleId, Arg.any()).resolves(undefined)
        const sut = new CmsScheduleProvider(cmsScheduleApi)

        // Act
        const result = await sut.getSchedule(scheduleId)

        // Assert
        expect(result).to.deep.equal(undefined)
        cmsScheduleApi.received(1).getSchedule(Arg.all())
      })
    })
  })
})

const scheduleDto: ScheduleDto = {
  id: 'schedule1',
  lesson_plan_id: 'lesson-plan1',
  org_id: 'org1',
}

const schedule = new Schedule('schedule1', 'lesson-plan1', 'org1')
