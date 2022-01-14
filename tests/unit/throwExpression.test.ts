import { expect } from 'chai'
import { throwExpression } from '../../src/helpers/throwExpression'

describe('throwExpression', () => {
  it('throws error with specified message', async () => {
    // Arrange
    const myString: string | undefined = undefined
    const errorMessage = 'myString is undefined'

    // Act
    const fn = () => myString ?? throwExpression(errorMessage)

    // Assert
    expect(fn).to.throw(errorMessage)
  })
})
