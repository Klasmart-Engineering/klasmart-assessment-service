export class LessonPlanItem {
  constructor(json: any) {
    this.materialId = json['materialId']
  }

  readonly materialId: string
}
