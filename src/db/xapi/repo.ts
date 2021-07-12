import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import { Inject, Service } from 'typedi'

export interface XAPIRecord {
  userId?: string
  serverTimestamp?: number
  xapi?: {
    clientTimestamp?: number
    data?: {
      statement?: {
        verb?: { display?: { [indexer: string]: string | undefined } }
        object?: {
          definition?: {
            name?: { [indexer: string]: string | undefined }
            extensions?: { [indexer: string]: string | undefined }
          }
        }
        context?: {
          contextActivities?: {
            category?: [{ id?: string }]
            parent?: [{ id?: string }]
          }
        }
        result?: {
          score?: {
            min?: number
            max?: number
            raw?: number
            scaled?: number
          }
          response?: string
        }
      }
    }
  }
}

@Service()
export class XAPIRepository {
  public static readonly DYNAMODB_TABLE_NAME_DI_KEY = 'dynamodb-table-name'
  public static readonly DYNAMODB_DOC_CLIENT_DI_KEY = 'dynamodb-doc-client'
  constructor(
    @Inject(XAPIRepository.DYNAMODB_TABLE_NAME_DI_KEY)
    private readonly tableName: string,
    @Inject(XAPIRepository.DYNAMODB_DOC_CLIENT_DI_KEY)
    private readonly docClient: DocumentClient,
  ) {}

  async searchXApiEvents(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XAPIRecord[]> {
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
