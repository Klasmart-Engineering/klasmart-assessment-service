import expect from '../../utils/chaiAsPromisedSetup'
import { DateClock } from '../../../src/cache/inMemory'

describe('DateClock.now', () => {
  it('executes without error', async () => {
    // Arrange
    const sut = new DateClock()

    // Act
    const actual = sut.now()
    const expected = Date.now()

    // Assert
    expect(actual).to.equal(expected)
  })
})
