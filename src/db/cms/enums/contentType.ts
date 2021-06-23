import { registerEnumType } from 'type-graphql'

export enum ContentType {
  LessonMaterial = 1,
  LessonPlan = 2,
  LessonAsset = 3,
}

registerEnumType(ContentType, {
  name: 'ContentType',
})
