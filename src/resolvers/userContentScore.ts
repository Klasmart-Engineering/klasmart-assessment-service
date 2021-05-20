import { ObjectType, Field } from "type-graphql"
import { randomArray, randomBool, randomInt, randomUser } from "../random"
import { Content } from "./material"
import { ScoreSummary } from "./scoreSummary"
import { TeacherScore } from "./teacherScore"
import { User } from "./user"

@Entity({ name: 'user_content_score' })
@ObjectType()
export class UserContentScore {
  @Field()
  public user: User
  @Field()
  public content: Content
  @Field()
  public score: ScoreSummary
  @Field()
  public seen: boolean
  @Field((type) => [TeacherScore])
  public teacherScores: TeacherScore[]

  constructor(user: User, content: Content, score = new ScoreSummary()) {
    this.user = user
    this.content = content
    this.score = score
    
    const {maximumPossibleScore, minimumPossibleScore} = content
    const range = maximumPossibleScore - minimumPossibleScore
    this.teacherScores = randomArray(
      randomInt(3, 0),
      () =>
        new TeacherScore(
          randomUser(),
          user,
          content,
          randomInt(range, minimumPossibleScore),
        ),
    )
    this.seen = randomBool(0.9)
  }
}
