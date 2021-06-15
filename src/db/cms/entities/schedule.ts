import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'schedules' })
export class Schedule {
  @PrimaryColumn()
  public readonly id!: string

  @Column({ name: 'lesson_plan_id' })
  public readonly lessonPlanId!: string

  @Column({ name: 'org_id' })
  public readonly orgId!: string
}
