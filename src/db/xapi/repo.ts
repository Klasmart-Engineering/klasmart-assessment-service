import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import { Service } from 'typedi'

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

const docClient = new DocumentClient({
  apiVersion: '2012-08-10',
})

@Service()
export class XAPIRepository {
  private TableName: string

  constructor(TableName = process.env.DYNAMODB_TABLE_NAME) {
    if (!TableName) {
      throw new Error(
        `Dynamodb TableName must be set using DYNAMODB_TABLE_NAME environment variable`,
      )
    }
    this.TableName = TableName
  }

  async searchXApiEvents(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XAPIRecord[]> {
    const xapiRecords: QueryOutput = await docClient
      .query({
        TableName: this.TableName,
        KeyConditionExpression:
          'userId = :userId AND (serverTimestamp BETWEEN :from AND :to)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':from': from || 0,
          ':to': to || Number.MAX_SAFE_INTEGER,
        },
      })
      .promise()

    return xapiRecords.Items || []
  }
}
