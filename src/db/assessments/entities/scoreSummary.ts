import { ObjectType, Field, Float, Int } from 'type-graphql'
import { Answer } from './answer'

type Medians<T> = [] | [T] | [T, T]

@ObjectType()
export class ScoreSummary {
  @Field({ nullable: true })
  public min?: number

  @Field({ nullable: true })
  public max?: number

  @Field(() => Int)
  public sum = 0

  @Field(() => Int)
  public scoreFrequency = 0

  @Field(() => Float, { nullable: true })
  public mean(): number | undefined {
    if (!this.scoreFrequency) {
      return
    }
    return this.sum / this.scoreFrequency
  }

  @Field(() => [Int])
  public scores: number[] = []

  @Field(() => [Answer])
  public answers: Answer[] = []

  @Field(() => Float, { nullable: true })
  public median(): number | undefined {
    if (!this.scores || this.scores.length <= 0) {
      return
    }
    const middle = this.scores.length >> 1
    const sorted = this.scores.sort((a, b) => a - b)
    return sorted[middle]
  }

  @Field(() => [Float], { nullable: true })
  public medians(): Medians<number> {
    if (this.scores.length <= 0) {
      return []
    }
    const sorted = this.scores.sort((a, b) => a - b)
    const lower = (this.scores.length - 1) >> 1
    const upper = this.scores.length >> 1
    if (sorted[lower] === sorted[upper]) {
      return [sorted[upper]]
    } else {
      return [sorted[lower], sorted[upper]]
    }
  }

  constructor(answers?: Answer[]) {
    if (answers) {
      for (const answer of answers) {
        this.addAnswer(answer)
      }
    }
  }

  public addAnswer(answer: Answer): void {
    this.answers.push(answer)

    const { score } = answer
    if (!score) {
      return
    }

    if (this.min === undefined || score < this.min) {
      this.min = score
    }
    if (this.max === undefined || score > this.max) {
      this.max = score
    }
    this.sum += score
    this.scoreFrequency += 1
    this.scores.push(score)
  }
}
