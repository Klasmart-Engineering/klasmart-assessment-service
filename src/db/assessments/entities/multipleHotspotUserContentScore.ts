import { Answer } from './answer'
import { UserContentScore } from './userContentScore'
import { ParsedXapiEvent } from '../../../helpers/parsedXapiEvent'

export class MultipleHotspotUserContentScore extends UserContentScore {
  private newAttemptSignalReceived = false

  public async applyEvent(xapiEvent: ParsedXapiEvent): Promise<void> {
    if (xapiEvent.verb === 'attempted') {
      this.startNewAttempt()
      return
    }
    const score = xapiEvent.score?.raw
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
      this.updateAnswer(score, answers[answers.length - 1])
    }
  }

  private startNewAttempt(): void {
    this.newAttemptSignalReceived = true
  }

  private updateAnswer(score: number, answer: Answer) {
    answer.score = score
  }
}
