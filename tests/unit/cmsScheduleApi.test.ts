import 'reflect-metadata'
import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { CmsScheduleApi, ScheduleDto } from '../../src/web/cms'
import { FetchWrapper } from '../../src/web/fetchWrapper'
import { EndUserBuilder } from '../builders'
import { throwExpression } from '../../src/helpers/throwExpression'
import ScheduleResponse from '../../src/web/cms/scheduleResponse'
import { ErrorMessage } from '../../src/helpers/errorMessages'

describe('cmsScheduleApi', () => {
  describe('getSchedule', () => {
    context('1 matching schedule exists', () => {
      it('returns matching schedule', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const roomId = 'room1'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsScheduleApi(networkRequestProvider, baseUrl)

        const endUser = new EndUserBuilder().authenticate().build()
        const authenticationToken =
          endUser.token ?? throwExpression('authentication token is undefined')
        const requestUrl = `${baseUrl}/schedules?schedule_ids=${roomId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(scheduleResponse)

        // Act
        const result = await sut.getSchedule(roomId, authenticationToken)

        // Assert
        expect(result).to.deep.equal(scheduleDto)
      })
    })

    context('authentication token is undefined', () => {
      it('throws authentication token error', async () => {
        // Arrange
        const baseUrl = 'https://cms.alpha.kidsloop.net/v1/internal'
        const roomId = 'room1'
        const networkRequestProvider = Substitute.for<FetchWrapper>()
        const sut = new CmsScheduleApi(networkRequestProvider, baseUrl)

        const authenticationToken = undefined
        const requestUrl = `${baseUrl}/schedules?schedule_ids=${roomId}`
        networkRequestProvider
          .fetch(requestUrl, {
            method: 'GET',
            headers: {
              cookie: `access=${authenticationToken}`,
            },
          })
          .resolves(scheduleResponse)

        // Act
        const fn = () => sut.getSchedule(roomId, authenticationToken)

        // Assert
        expect(fn()).to.be.rejectedWith(
          ErrorMessage.authenticationTokenUndefined,
        )
      })
    })
  })
})

const scheduleDto: ScheduleDto = {
  id: '6099c496e05f6e940027387c',
  lesson_plan_id: '6099c3111f42c08c3e3d44d2',
  org_id: 'a556a3a0-dc86-45de-8eca-2d7b6a80d1ca',
}

const scheduleResponse: ScheduleResponse = {
  total: 1,
  data: [scheduleDto],
}
