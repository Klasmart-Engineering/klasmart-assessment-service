import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { checkToken, IToken, TokenDecoder } from '../../src/auth/auth'
import EndUserBuilder from '../builders/endUserBuilder'

describe('auth.checkToken', () => {
  context(`token decoder returns null`, () => {
    it('returns undefined decoded token', async () => {
      const tokenDecoder = Substitute.for<TokenDecoder>()
      const encodedToken: string | undefined = 'abcd'
      tokenDecoder.decode(encodedToken).returns(null)
      const result = await checkToken(encodedToken, tokenDecoder)
      expect(result).to.be.undefined
      tokenDecoder.received(1).decode(encodedToken)
    })
  })

  context(`token decoder returns a string instead of an object`, () => {
    it('returns undefined decoded token', async () => {
      const tokenDecoder = Substitute.for<TokenDecoder>()
      const encodedToken: string | undefined = 'abcd'
      tokenDecoder.decode(encodedToken).returns('decoded token')
      const result = await checkToken(encodedToken, tokenDecoder)
      expect(result).to.be.undefined
      tokenDecoder.received(1).decode(encodedToken)
    })
  })

  context(`token decoder returns an object without an iss key`, () => {
    it('returns undefined decoded token', async () => {
      const tokenDecoder = Substitute.for<TokenDecoder>()
      const encodedToken: string | undefined = 'abcd'
      tokenDecoder.decode(encodedToken).returns({})
      const result = await checkToken(encodedToken, tokenDecoder)
      expect(result).to.be.undefined
      tokenDecoder.received(1).decode(encodedToken)
    })
  })

  context(
    `token decoder returns an object with an iss key but it is an object instead of a string`,
    () => {
      it('returns undefined decoded token', async () => {
        const tokenDecoder = Substitute.for<TokenDecoder>()
        const encodedToken: string | undefined = 'abcd'
        tokenDecoder.decode(encodedToken).returns({ iss: { value: 'my_iss' } })
        const result = await checkToken(encodedToken, tokenDecoder)
        expect(result).to.be.undefined
        tokenDecoder.received(1).decode(encodedToken)
      })
    },
  )

  context(
    `token decoder returns an object with an iss key but it is not included in our list of issuers`,
    () => {
      it('returns undefined decoded token', async () => {
        const tokenDecoder = Substitute.for<TokenDecoder>()
        const encodedToken = 'abcd'
        tokenDecoder.decode(encodedToken).returns({ iss: 'my_iss' })
        const result = await checkToken(encodedToken, tokenDecoder)
        expect(result).to.be.undefined
        tokenDecoder.received(1).decode(encodedToken)
      })
    },
  )

  context(`token decoder returns a valid object`, () => {
    it('returns a valid decoded token', async () => {
      const tokenDecoder = Substitute.for<TokenDecoder>()
      const endUser = new EndUserBuilder().authenticate().build()
      const encodedToken = endUser.token!
      const decoderReturnValue: { [key: string]: unknown } = {
        iss: 'calmid-debug',
      }
      tokenDecoder.decode(encodedToken).returns(decoderReturnValue)
      const result = await checkToken(encodedToken, tokenDecoder)
      const expected: IToken = {
        id: endUser.userId,
        email: endUser.email,
      }
      expect(result).to.include(expected)
      tokenDecoder.received(1).decode(encodedToken)
    })
  })

  // TODO: Maybe add a couple cases for the rejected cases of the jsonwebtoken.verify call.
})
