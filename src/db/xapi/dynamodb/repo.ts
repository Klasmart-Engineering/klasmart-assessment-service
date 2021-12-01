import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb'
import { withLogger } from 'kidsloop-nodejs-logger'
import { XApiRecord } from '../interfaces'
import { IXApiRepository } from '../repo'
import e from 'cors'

const logger = withLogger('XapiDynamodbReposiroty')

class DynamoDbException extends Error {
  constructor(message: string) {
    logger.error(message)
    super(message)
    Object.setPrototypeOf(this, DynamoDbException.prototype)
  }
}

export class XApiDynamodbRepository implements IXApiRepository {
  constructor(
    private readonly tableName: string,
    private readonly docClient: DocumentClient,
    private readonly client: DynamoDBClient,
  ) {}

  async searchXApiEvents(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]> {
    const result: QueryOutput = await this.docClient
      .query({
        TableName: this.tableName,
        KeyConditionExpression:
          'userId = :userId AND (serverTimestamp BETWEEN :from AND :to)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':from': from || 0,
          ':to': to || Number.MAX_SAFE_INTEGER,
        },
      })
      .promise()

    return result.Items || []
  }

  async checkTableIsActive(): Promise<boolean> {
    const command = new DescribeTableCommand({
      TableName: this.tableName,
    })
    try {
      const response: DescribeTableCommandOutput = await this.client.send(
        command,
      )
      if (response.Table?.TableStatus !== 'ACTIVE') {
        throw new DynamoDbException('DynamoDb table is not ACTIVE')
      }
      return true
    } catch (e) {
      throw new DynamoDbException(e.message)
    }
  }
}
