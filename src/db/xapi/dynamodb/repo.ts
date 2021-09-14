import { XApiRecord } from '..'
import { IXApiRepository } from '../repo'
import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import { Inject } from 'typedi'

export class XApiDynamodbRepository implements IXApiRepository {
  constructor(
    private readonly tableName: string,
    private readonly docClient: DocumentClient,
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
}
