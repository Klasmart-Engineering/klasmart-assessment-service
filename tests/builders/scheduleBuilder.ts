import { getRepository } from 'typeorm'
import { CMS_CONNECTION_NAME } from '../../src/db/cms/connectToCmsDatabase'
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
    const entity = new Schedule()
    const mutableEntity: Mutable<Schedule> = entity
    mutableEntity.id = this.roomId
    mutableEntity.lessonPlanId = this.lessonPlanId
    mutableEntity.orgId = this.orgId
    return entity
  }

  public async buildAndPersist(): Promise<Schedule> {
    const entity = this.build()
    return await getRepository(Schedule, CMS_CONNECTION_NAME).save(entity)
  }
}
