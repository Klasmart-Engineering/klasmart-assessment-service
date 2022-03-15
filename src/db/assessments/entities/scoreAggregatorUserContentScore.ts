import { Answer } from './answer'
import { UserContentScore } from './userContentScore'
import { ParsedXapiEvent } from '../../../helpers/parsedXapiEvent'

/**
 * This class makes up for activities that are scored differently than
 * all the others. These activities report "score so far" after each step
 * in the activity. In other words, there's no submit button. We use
 * the "attempted" verb as a demarcation between actual attempts. So
 * instead of always adding new answers, we update the last one.
 */
export class ScoreAggregatorUserContentScore extends UserContentScore {
  private newAttemptSignalReceived = false

  public async applyEvent(
    xapiEvent: ParsedXapiEvent,
  ): Promise<Answer | undefined> {
    if (xapiEvent.verb === 'attempted') {
      this.startNewAttempt()
      return
    }
    const score = xapiEvent.score?.raw
    const reponse = xapiEvent.response
    if (score == null) {
      return
    }

    let answers = await this.answers
    if (!answers) {
      answers = []
      this.answers = Promise.resolve(answers)
    }

    if (this.newAttemptSignalReceived || answers.length <= 0) {
      this.newAttemptSignalReceived = false
      await super.applyEvent(xapiEvent)
    } else {
      this.updateAnswer(score, reponse, answers[answers.length - 1])
    }
  }

  private startNewAttempt(): void {
    this.newAttemptSignalReceived = true
  }

  private updateAnswer(
    score: number,
    response: string | undefined,
    answer: Answer,
  ) {
    answer.score = score
    answer.answer = response
  }
}
