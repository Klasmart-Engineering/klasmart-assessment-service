import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  DescribeTableCommand,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { XApiRecord } from '../interfaces'
import { IXApiRepository } from '../repo'

const logger = withLogger('XApiDynamodbRepository')

export class DynamoDbException extends Error {
  constructor(message: string) {
    logger.error(message)
    super(message)
    Object.setPrototypeOf(this, DynamoDbException.prototype)
  }
}

export class XApiDynamodbRepository implements IXApiRepository {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBClient,
  ) {}

  async searchXapiEventsWithRoomId(_roomId: string): Promise<XApiRecord[]> {
    return []
  }

  async groupSearchXApiEventsForUsers(
    _userIds: string[],
    _from?: number,
    _to?: number,
  ): Promise<XApiRecord[]> {
    return []
  }

  async searchXApiEventsForUser(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]> {
    logger.debug(
      `searchXApiEventsForUser >> userId: ${userId}, from: ${from}, to: ${to}`,
    )
    const input: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression:
        'userId = :userId AND (serverTimestamp BETWEEN :from AND :to)',
      ExpressionAttributeValues: marshall({
        ':userId': userId,
        ':from': from || 0,
        ':to': to || Number.MAX_SAFE_INTEGER,
      }),
    }
    const command: QueryCommand = new QueryCommand(input)
    const result: QueryCommandOutput = await this.client.send(command)
    const data = result.Items?.map((x) => unmarshall(x) as XApiRecord) || []

    logger.debug(
      `searchXApiEventsForUser >> userId: ${userId}, from: ${from}, ` +
        ` to: ${to} => items found: ${data.length}`,
    )
    return data
  }

  async checkTableIsActive(): Promise<boolean> {
    const command = new DescribeTableCommand({
      TableName: this.tableName,
    })
    let response: DescribeTableCommandOutput
    try {
      response = await this.client.send(command)
    } catch (e) {
      logger.error(`❌ Failed to connect to DynamoDB table ${this.tableName}`)
      throw new DynamoDbException(e.message)
    }
    if (response.Table?.TableStatus !== 'ACTIVE') {
      const msg = `❌ DynamoDB table ${this.tableName} is not ACTIVE`
      logger.error(msg)
      throw new DynamoDbException(msg)
    }
    logger.info(`🍉 DynamoDB table ${this.tableName} is ACTIVE`)
    return true
  }
}
