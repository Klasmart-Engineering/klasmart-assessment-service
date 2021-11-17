export class Schedule {
  constructor(
    public readonly id: string,
    public readonly lessonPlanId: string,
    public readonly orgId: string,
  ) {}
}
