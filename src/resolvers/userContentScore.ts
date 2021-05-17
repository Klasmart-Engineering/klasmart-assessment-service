import { ObjectType, Field } from "type-graphql"
import { randomArray, randomInt, randomUser } from "../random"
import { Content } from "./material"
import { Score } from "./score"
import { TeacherScore } from "./teacherScore"
import { User } from "./user"

@ObjectType()
export class UserContentScore {
  @Field()
  public user: User
  @Field()
  public content: Content
  @Field()
  public score: Score
  @Field(type => [TeacherScore])
  public teacherScores: TeacherScore[]
  @Field()
  public minimumPossibleScore: number
  @Field()
  public maximumPossibleScore: number

  constructor(user: User, content: Content, score = new Score()) {
    this.user = user
    this.content = content
    this.score = score
    
    const {maximumPossibleScore, minimumPossibleScore} = content
    this.minimumPossibleScore = minimumPossibleScore 
    this.maximumPossibleScore = maximumPossibleScore
    const range = maximumPossibleScore - minimumPossibleScore
    this.teacherScores = randomArray(
        randomInt(3,0),
        () => new TeacherScore(
            randomUser(),
            user,
            content,
            randomInt(range, minimumPossibleScore)
        )
    )
  }
}