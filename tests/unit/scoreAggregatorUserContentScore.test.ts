import { expect } from 'chai'
import { v4 } from 'uuid'
import { ScoreAggregatorUserContentScore } from '../../src/db/assessments/entities/scoreAggregatorUserContentScore'
import { ParsedXapiEvent } from '../../src/helpers/parsedXapiEvent'
import { AnswerBuilder } from '../builders'

describe('ScoreAggregatorUserContentScore', () => {
  context(
    '1 existing answer with score of 0 score; new event has score of 1',
    () => {
      it('updates the score of the existing answer to be 1', async () => {
        const roomId = v4()
        const studentId = v4()
        const contentKey = v4()
        const xapiRecord: ParsedXapiEvent = {
          userId: studentId,
          h5pId: v4(),
          timestamp: Date.now(),
          verb: 'answered',
          score: { min: 0, max: 5, raw: 1 },
        }
        const sut = new ScoreAggregatorUserContentScore(
          roomId,
          studentId,
          contentKey,
        )
        const answer = new AnswerBuilder(sut)
          .withScore({ raw: 0, min: 0, max: 5 })
          .build()
        sut.answers = Promise.resolve([answer])

        // Act
        await sut.applyEvent(xapiRecord)

        // Assert
        expect(answer.score).to.equal(1)
        const updatedAnswers = await sut.answers
        expect(updatedAnswers).to.have.lengthOf(1)
      })
    },
  )

  context('0 existing answers; new event is has undefined score', () => {
    it('answers remain empty', async () => {
      const roomId = v4()
      const studentId = v4()
      const contentKey = v4()
      const xapiRecord: ParsedXapiEvent = {
        userId: studentId,
        h5pId: v4(),
        timestamp: Date.now(),
        verb: 'interacted',
        score: undefined,
      }
      const sut = new ScoreAggregatorUserContentScore(
        roomId,
        studentId,
        contentKey,
      )

      // Act
      await sut.applyEvent(xapiRecord)

      // Assert
      const answers = await sut.answers
      expect(answers).to.be.empty
    })
  })
})
