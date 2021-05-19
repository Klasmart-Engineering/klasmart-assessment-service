import { DocumentClient } from 'aws-sdk/clients/dynamodb'

interface XAPIRecord {
  xapi?: string
  userId?: string
  serverTimestamp?: number
}

const awsRegion = process.env.AWS_REGION

if (!awsRegion) {
  throw new Error(
    `Dynamodb awsRegion must be set using AWS_REGION environment variable`,
  )
}

const docClient = new DocumentClient({
  apiVersion: '2012-08-10',
  region: awsRegion,
})

export class Repo {
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
  ): Promise<XAPIRecord[] | undefined> {
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

    return xapiRecords.Items?.map((xapiRecord) => {
      xapiRecord.xapi = JSON.stringify(xapiRecord.xapi)
      return xapiRecord
    })
  }
}

export const repo = new Repo()
