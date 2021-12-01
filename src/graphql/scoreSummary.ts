import { ObjectType, Field, Float, Int } from 'type-graphql'
import { Answer } from '../db/assessments/entities'

type Medians<T> = [] | [T] | [T, T]

@ObjectType()
export class ScoreSummary {
  private _min?: number
  private _max?: number
  private _sum = 0
  private _scoreFrequency = 0
  private _scores: number[] = []
  private _answers: Answer[] = []

  @Field(() => Float, { nullable: true })
  public get min(): number | undefined {
    return this._min
  }

  @Field(() => Float, { nullable: true })
  public get max(): number | undefined {
    return this._max
  }

  @Field(() => Int)
  public get sum(): number {
    return this._sum
  }

  @Field(() => Int)
  public get scoreFrequency(): number {
    return this._scoreFrequency
  }

  @Field(() => Float, { nullable: true })
  public mean(): number | undefined {
    if (!this.scoreFrequency) {
      return
    }
    return this.sum / this.scoreFrequency
  }

  @Field(() => [Int])
  public get scores(): ReadonlyArray<number> {
    return this._scores
  }

  @Field(() => [Answer])
  public get answers(): ReadonlyArray<Answer> {
    return this._answers
  }

  @Field(() => Float, { nullable: true })
  public median(): number | undefined {
    if (!this.scores || this.scores.length <= 0) {
      return
    }
    const middle = this.scores.length >> 1
    const sorted = this._scores.sort((a, b) => a - b)
    return sorted[middle]
  }

  @Field(() => [Float], { nullable: true })
  public medians(): Medians<number> {
    if (this.scores.length <= 0) {
      return []
    }
    const sorted = this._scores.sort((a, b) => a - b)
    const lower = (this.scores.length - 1) >> 1
    const upper = this.scores.length >> 1
    if (sorted[lower] === sorted[upper]) {
      return [sorted[upper]]
    } else {
      return [sorted[lower], sorted[upper]]
    }
  }

  constructor(answers: Answer[]) {
    for (const answer of answers) {
      this.addAnswer(answer)
    }
  }

  public addAnswer(answer: Answer): void {
    this._answers.push(answer)

    const { score } = answer
    if (score === undefined) {
      return
    }

    if (this.min === undefined || score < this.min) {
      this._min = score
    }
    if (this.max === undefined || score > this.max) {
      this._max = score
    }
    this._sum += score
    this._scoreFrequency += 1
    this._scores.push(score)
  }
}
