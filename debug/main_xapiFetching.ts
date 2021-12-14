import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import fs from 'fs'
import path from 'path'
import { XApiDynamodbRepository } from '../src/db/xapi/dynamodb/repo'
async function main() {
  const dynamoDbClient = new DynamoDBClient({
    apiVersion: '2012-08-10',
  })
  const repo = new XApiDynamodbRepository(
    'kidsloop-alpha-xapi-ace-ray',
    dynamoDbClient,
  )
  const userId = 'aaef6d8a-53c4-462c-8c74-4483510c646d'
  const events = await repo.searchXApiEvents(
    userId, //'2c0aa9c2-bd4e-4662-b5e2-990aba436eab',
    1622411560000, //1623798322000,
    1624926143128, //11623146952801,
  )
  fs.writeFile(
    path.join(__dirname, `./output/xapi_userid_${userId}.json`),
    JSON.stringify(events, null, 2),
    (err) => {
      if (err) return console.log(err)
      console.log('events > data.json')
    },
  )
}
;(async () => {
  await main()
})().catch((e) => {
  console.log(e)
})
