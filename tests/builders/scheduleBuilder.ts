import { getRepository } from 'typeorm'
import { Mutable } from '../utils/mutable'
import { Schedule } from '../../src/db/cms/entities/schedule'
import { v4 } from 'uuid'

export default class ScheduleBuilder {
  private roomId = v4()
  private lessonPlanId = v4()
  private orgId = v4()

  withRoomId(value: string): this {
    this.roomId = value
    return this
  }

  withLessonPlanId(value: string): this {
    this.lessonPlanId = value
    return this
  }

  withOrgId(value: string): this {
    this.orgId = value
    return this
  }

  public build(): Schedule {
    const entity = new Schedule(this.roomId, this.lessonPlanId, this.orgId)
    return entity
  }
}
