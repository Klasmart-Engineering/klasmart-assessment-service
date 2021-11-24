import { expect } from 'chai'
import { CmsScheduleApi } from '../../src/web/cmsScheduleApi'
import { ScheduleDto } from '../../src/web/scheduleResponse'

describe('cmsScheduleApi', function () {
  describe('getSchedule', () => {
    context('provided scheduleId exists', () => {
      it('returns expected schedule', async () => {
        // Arrange
        const scheduleId = '6099c496e05f6e940027387c'
        const sut = new CmsScheduleApi()

        // Act
        const result = await sut.getSchedule(scheduleId)

        // Assert
        const expected: ScheduleDto = {
          id: '6099c496e05f6e940027387c',
          lesson_plan_id: '6099c3111f42c08c3e3d44d2',
          org_id: 'a556a3a0-dc86-45de-8eca-2d7b6a80d1ca',
        }
        expect(result).to.deep.equal(expected)
      })
    })
  })
})
