import { ObjectType, Field, Float, Int } from "type-graphql"
import { Answer } from "./answer"

@ObjectType()
export class ScoreSummary {
  @Field({nullable: true})
  public min?: number

  @Field({nullable: true})
  public max?: number

  @Field()
  public sum: number = 0

  @Field()
  public scoreFrequency: number = 0

  @Field(type => Float, {nullable: true})
  public mean() {
    if(!this.scoreFrequency) { return }
    return this.sum / this.scoreFrequency
  }

  @Field(type => [Int])
  public scores: number[] = []

  @Field(type => [Answer])
  public answers: Answer[] = []

  @Field(type => Float, {nullable: true})
  public median() {
    if(!this.scores || this.scores.length <= 0) { return }
    const middle = this.scores.length >> 1
    const sorted = this.scores.sort((a,b) => a-b)  
    return sorted[middle]
  }

  @Field(type => [Float], {nullable: true})
  public medians() {
    if(this.scores.length <= 0) { return [] }
    const sorted = this.scores.sort((a,b) => a-b)  
    const lower = (this.scores.length-1) >> 1
    const upper = this.scores.length >> 1
    if(sorted[lower] === sorted[upper]) {
        return [sorted[upper]]
    } else {
        return [sorted[lower],sorted[upper]]
    }
  }

  constructor(answer?: Answer) {
      if(answer) { this.addAnswer(answer) }
  }

  public addAnswer(answer: Answer) {
    const {score} = answer
    if(score) {
      if(this.min === undefined || score < this.min) {
        this.min = score
      }
      if(this.max === undefined || score > this.max) {
        this.max = score
      }
      this.sum += score
      this.scoreFrequency += 1
      this.scores.push(score)
    }
    this.answers.push(answer)
  }
}
