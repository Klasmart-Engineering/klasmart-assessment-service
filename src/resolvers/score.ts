import { ObjectType, Field, Float } from "type-graphql"

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
    this.sum += score
    this.frequency += 1
  }
}
