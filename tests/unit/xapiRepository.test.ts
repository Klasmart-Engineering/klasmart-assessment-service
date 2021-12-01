import Substitute, { Arg } from '@fluffy-spoon/substitute'
import {
  DynamoDBClient,
  QueryCommandOutput,
  DescribeTableCommand,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { expect } from 'chai'
import { v4 } from 'uuid'
import { XApiRecord } from '../../src/db/xapi'
import {
  XApiDynamodbRepository,
  DynamoDbException,
} from '../../src/db/xapi/dynamodb/repo'

describe('XApiDynamodbRepository.searchXapiEvents', () => {
  context('dynamodb client returns list containing 1 xapi record', () => {
    it('returns a list containing 1 xapi record', async () => {
      const dynamoDbClient = Substitute.for<DynamoDBClient>()
      const record1: XApiRecord = {
        serverTimestamp: Date.now(),
        userId: v4(),
        xapi: {
          clientTimestamp: Date.now(),
          data: { statement: { result: { response: 'hello' } } },
        },
      }
      const output: QueryCommandOutput = {
        $metadata: Arg.any(),
        Items: [marshall(record1)],
      }
      dynamoDbClient.send(Arg.any()).resolves(output)

      const sut = new XApiDynamodbRepository('table-name', dynamoDbClient)
      const rawXapiRecords = await sut.searchXApiEvents(
        'user1',
        0,
        Date.now() + 1,
      )
      expect(rawXapiRecords).to.have.lengthOf(1)
    })
  })

  context(
    'dynamodb client returns list containing 1 xapi record, do not specify to and from args',
    () => {
      it('returns a list containing 1 xapi record', async () => {
        const dynamoDbClient = Substitute.for<DynamoDBClient>()
        const record1: XApiRecord = {
          serverTimestamp: Date.now(),
          userId: v4(),
          xapi: {
            clientTimestamp: Date.now(),
            data: { statement: { result: { response: 'hello' } } },
          },
        }
        const output: QueryCommandOutput = {
          $metadata: Arg.any(),
          Items: [marshall(record1)],
        }
        dynamoDbClient.send(Arg.any()).resolves(output)

        const sut = new XApiDynamodbRepository('table-name', dynamoDbClient)
        const rawXapiRecords = await sut.searchXApiEvents('user1') // Dont specify to and from.
        expect(rawXapiRecords).to.have.lengthOf(1)
      })
    },
  )

  context(`dynamodb client returns undefined xapi record list`, () => {
    it('returns an empty list of xapi records', async () => {
      const dynamoDbClient = Substitute.for<DynamoDBClient>()
      const output: QueryCommandOutput = {
        $metadata: Arg.any(),
        Items: undefined,
      }
      dynamoDbClient.send(Arg.any()).resolves(output)

      const sut = new XApiDynamodbRepository('table-name', dynamoDbClient)
      const rawXapiRecords = await sut.searchXApiEvents(
        'user1',
        0,
        Date.now() + 1,
      )
      expect(rawXapiRecords).to.be.empty
    })
  })
})

describe('XApiDynamodbRepository.checkTableIsActive', () => {
  context(
    'dynamodb client returns table description if the table exists and is active',
    () => {
      it('returns true', async () => {
        const dynamoDbClient = Substitute.for<DynamoDBClient>()

        const tableName = 'xapi-table'
        const output: DescribeTableCommandOutput = {
          $metadata: Arg.any(),
          Table: {
            TableName: tableName,
            TableStatus: 'ACTIVE',
          },
        }
        dynamoDbClient
          .send(Arg.is((obj) => obj instanceof DescribeTableCommand))
          .resolves(output)

        const sut = new XApiDynamodbRepository(tableName, dynamoDbClient)
        const tableIsActive = await sut.checkTableIsActive()
        expect(tableIsActive).to.eq(true)
      })
    },
  )

  context(
    'dynamodb client returns table description if the table exists and is NOT active',
    () => {
      it('throws error', async () => {
        const dynamoDbClient = Substitute.for<DynamoDBClient>()

        const tableName = 'xapi-table'
        const output: DescribeTableCommandOutput = {
          $metadata: Arg.any(),
          Table: {
            TableName: tableName,
            TableStatus: 'INACTIVE',
          },
        }
        dynamoDbClient
          .send(Arg.is((obj) => obj instanceof DescribeTableCommand))
          .resolves(output)

        const sut = new XApiDynamodbRepository(tableName, dynamoDbClient)
        expect(sut.checkTableIsActive()).to.be.rejectedWith(DynamoDbException)
      })
    },
  )

  context('dynamodb client throws error', () => {
    it('throws error', async () => {
      const dynamoDbClient = Substitute.for<DynamoDBClient>()

      const tableName = 'xapi-table'
      dynamoDbClient
        .send(Arg.is((obj) => obj instanceof DescribeTableCommand))
        .throws(new Error('failed to connect'))

      const sut = new XApiDynamodbRepository(tableName, dynamoDbClient)
      expect(sut.checkTableIsActive()).to.be.rejectedWith(DynamoDbException)
    })
  })
})
