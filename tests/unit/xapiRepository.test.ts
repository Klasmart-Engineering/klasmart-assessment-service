import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { AWSError, Request } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { PromiseResult } from 'aws-sdk/lib/request'
import { expect } from 'chai'
import { v4 } from 'uuid'
import { XAPIRecord, XAPIRepository } from '../../src/db/xapi/repo'

describe('xapiRepository.searchXapiEvents', () => {
  context('dynamodb client returns list containing 1 xapi record', () => {
    it('returns a list containing 1 xapi record', async () => {
      const documentClient = Substitute.for<DocumentClient>()
      const transientResult = Substitute.for<
        Request<DocumentClient.QueryOutput, AWSError>
      >()
      const record1: XAPIRecord = {
        serverTimestamp: Date.now(),
        userId: v4(),
        xapi: {
          clientTimestamp: Date.now(),
          data: { statement: { result: { response: 'hello' } } },
        },
      }
      const promiseResult: PromiseResult<
        DocumentClient.QueryOutput,
        AWSError
      > = {
        $response: Arg.any(),
        Items: [record1],
      }
      transientResult.promise().resolves(promiseResult)
      documentClient.query(Arg.any()).returns(transientResult)

      const sut = new XAPIRepository('table-name', documentClient)
      const rawXapiRecords = await sut.searchXApiEvents(
        'user1',
        Arg.any(),
        Arg.any(),
      )
      expect(rawXapiRecords).to.have.lengthOf(1)
    })
  })

  context(
    'dynamodb client returns list containing 1 xapi record, do not specify to and from args',
    () => {
      it('returns a list containing 1 xapi record', async () => {
        const documentClient = Substitute.for<DocumentClient>()
        const transientResult = Substitute.for<
          Request<DocumentClient.QueryOutput, AWSError>
        >()
        const record1: XAPIRecord = {
          serverTimestamp: Date.now(),
          userId: v4(),
          xapi: {
            clientTimestamp: Date.now(),
            data: { statement: { result: { response: 'hello' } } },
          },
        }
        const promiseResult: PromiseResult<
          DocumentClient.QueryOutput,
          AWSError
        > = {
          $response: Arg.any(),
          Items: [record1],
        }
        transientResult.promise().resolves(promiseResult)
        documentClient.query(Arg.any()).returns(transientResult)

        const sut = new XAPIRepository('table-name', documentClient)
        const rawXapiRecords = await sut.searchXApiEvents('user1') // Dont specify to and from.
        expect(rawXapiRecords).to.have.lengthOf(1)
      })
    },
  )

  context(`dynamodb client returns undefined xapi record list`, () => {
    it('returns an empty list of xapi records', async () => {
      const documentClient = Substitute.for<DocumentClient>()
      const transientResult = Substitute.for<
        Request<DocumentClient.QueryOutput, AWSError>
      >()
      const record1: XAPIRecord = {
        serverTimestamp: Date.now(),
        userId: v4(),
        xapi: {
          clientTimestamp: Date.now(),
          data: { statement: { result: { response: 'hello' } } },
        },
      }
      const promiseResult: PromiseResult<
        DocumentClient.QueryOutput,
        AWSError
      > = {
        $response: Arg.any(),
        Items: undefined,
      }
      transientResult.promise().resolves(promiseResult)
      documentClient.query(Arg.any()).returns(transientResult)

      const sut = new XAPIRepository('table-name', documentClient)
      const rawXapiRecords = await sut.searchXApiEvents(
        'user1',
        Arg.any(),
        Arg.any(),
      )
      expect(rawXapiRecords).to.be.empty
    })
  })
})
