import { ObjectType, Field } from "type-graphql"
import { v4 } from "uuid"
import { pick, randomInt } from "../../../random"

@ObjectType()
export class Content {
  @Field()
  public content_id: string
  
  @Field()
  public name: string

  @Field()
  public type: string

  public minimumPossibleScore: number
  public maximumPossibleScore: number

  constructor(
    content_id: string,
    name: string,
    type: string,
    scoreRange = 10,
    minimumPossibleScore = 0,
  ) {
    this.content_id = content_id
    this.name = name
    this.type = type
    this.minimumPossibleScore = minimumPossibleScore
    this.maximumPossibleScore = minimumPossibleScore + scoreRange
  }


  public static random(
    content_id: string = v4()
  ) {
    const min = randomInt(3, 0)
    const max = min + randomInt(20)
    return new Content(
      content_id,
      pick(activity_names),
      pick(activity_types),
      max,
      min,
    )
  }
}

const activity_names = [
  'Matching Words with Pictures',
  'Listen and repeat',
  'Word search',
  'Essay',
  'Video',
]

const activity_types = [
  'Interactive Video',
  'Course Presentation',
  'Multiple Choice',
  'Quiz',
  'Fill in the Blank',
  'Drag the Words',
]