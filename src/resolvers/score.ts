import { ObjectType, Field, Float, Int } from "type-graphql"

@ObjectType()
export class Score {
  @Field({nullable: true})
  public min?: number

  @Field({nullable: true})
  public max?: number

  @Field()
  public sum: number = 0

  @Field()
  public frequency: number = 0

  @Field(type => Float, {nullable: true})
  public mean() {
    if(!this.frequency) { return }
    return this.sum / this.frequency
  }

  @Field(type => [Int])
  public scores: number[] = []

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

  constructor(score?: number) {
    if(score) { this.addScore(score) }
  }

  public addScore(score: number) {
    if(this.min === undefined || score < this.min) {
      this.min = score
    }
    if(this.max === undefined || score > this.max) {
      this.max = score
    }
    this.scores.push(score)
    this.sum += score
    this.frequency += 1
  }
}
