import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import { Inject, Service } from 'typedi'
import { XApiRecord } from '../interfaces'

@Service()
export class XApiDynamodbRepository {
  public static readonly DYNAMODB_TABLE_NAME_DI_KEY = 'dynamodb-table-name'
  public static readonly DYNAMODB_DOC_CLIENT_DI_KEY = 'dynamodb-doc-client'
  constructor(
    @Inject(XApiDynamodbRepository.DYNAMODB_TABLE_NAME_DI_KEY)
    private readonly tableName: string,
    @Inject(XApiDynamodbRepository.DYNAMODB_DOC_CLIENT_DI_KEY)
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
