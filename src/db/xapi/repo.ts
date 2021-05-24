import { DocumentClient } from 'aws-sdk/clients/dynamodb'

interface XAPIRecord {
  xapi?: string
  userId?: string
  serverTimestamp?: number
}

const docClient = new DocumentClient({
  apiVersion: '2012-08-10',
})

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

  async searchXApiEvents(userId: string, from?: number, to?: number) {
    const xapiRecords = await docClient
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

    return xapiRecords.Items
  }
}

export const xapiRepository = new XAPIRepository()
