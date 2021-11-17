export default interface ScheduleResponse {
  data: ScheduleDto[]
  total: number
}

export interface ScheduleDto {
  id: string
  lesson_plan_id: string
  org_id: string
}
