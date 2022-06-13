import { expect } from 'chai'
import { testClient } from '../../utils/globalIntegrationTestHooks'
import { gqlTry } from '../../utils/gqlTry'

describe('readyResolver', () => {
  context('server is up and running', () => {
    it('returns true', async () => {
      const result = await readyQuery()
      expect(result).to.be.true
    })
  })
})

export async function readyQuery(): Promise<boolean> {
  const { query } = testClient

  const operation = () =>
    query({
      query: 'query { ready }',
    })

  const res = await gqlTry(operation, true)
  return res.data?.ready
}
