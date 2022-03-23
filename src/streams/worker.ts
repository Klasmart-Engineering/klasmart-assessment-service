import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container } from 'typedi'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { RoomScoresTemplateProvider2 } from './calculateScores'
import { XApiRecordBuilder } from '../../tests/builders'

const logger = withLogger('worker')

useContainer(TypeormTypediContainer)

const main = async () => {
  const assessmentDatabaseUrl = process.env.ASSESSMENT_DATABASE_URL
  if (!assessmentDatabaseUrl) {
    throw new Error('Please specify a value for ASSESSMENT_DATABASE_URL')
  }
  logger.info(`Database url: ${assessmentDatabaseUrl}`)
  await connectToAssessmentDatabase(assessmentDatabaseUrl)
  const roomScoreProviderWorker = TypeormTypediContainer.get(
    RoomScoresTemplateProvider2,
  )

  logger.info('🦑 Creating events...')
  const ct = 1647865897520 || Date.now()

  const rawXapiEvents = []
  for (const rId of [...Array(2).keys()]) {
    for (const uId of [...Array(2).keys()]) {
      for (const hId of [...Array(2).keys()]) {
        for (const eId of [...Array(5).keys()]) {
          const roomId = `room${rId}` // 2 rooms
          const userId = `user${uId}` // 4 users
          const h5pId = `h5pId${hId}` // 8 activities
          const h5pName = `h5pName${hId}`
          const h5pType = `h5pType${hId}`
          const score = { min: 0, max: 2, raw: 1 }

          const i = uId * 4 + hId * 4 + eId

          const xapiRecord = new XApiRecordBuilder()
            .withRoomId(roomId)
            .withUserId(userId)
            .withH5pId(h5pId)
            .withH5pSubId(undefined)
            .withH5pName(h5pName)
            .withH5pType(h5pType)
            .withScore(score)
            .withResponse(undefined)
            .withServerTimestamp(ct + i)
            .withClientTimestamp(ct + i)
            .build()
          rawXapiEvents.push(xapiRecord)
        }
      }
    }
  }

  // const rawXapiEvents = [...Array(80).keys()].map((i) => {
  //   const roomId = `room${i % 2}` // 2 rooms
  //   const userId = `user${i % 4}` // 4 users
  //   const h5pId = `h5pId${i % 8}` // 8 activities
  //   const h5pName = `h5pName${i % 8}`
  //   const h5pType = `h5pType${i % 8}`
  //   const score = { min: 0, max: 2, raw: 1 }

  //   const xapiRecord = new XApiRecordBuilder()
  //     .withRoomId(roomId)
  //     .withUserId(userId)
  //     .withH5pId(h5pId)
  //     .withH5pSubId(undefined)
  //     .withH5pName(h5pName)
  //     .withH5pType(h5pType)
  //     .withScore(score)
  //     .withResponse(undefined)
  //     .withServerTimestamp(ct + i)
  //     .withClientTimestamp(ct + i)
  //     .build()
  //   return xapiRecord
  // })

  logger.info('🏋️‍♀️ Processing events!')
  await roomScoreProviderWorker.process(rawXapiEvents)
  logger.info('🧘‍♀️ Done!')

  const someEvent = rawXapiEvents[0]
  console.log(someEvent)
  await roomScoreProviderWorker.getRoom({
    roomId: someEvent.roomId,
  })
  await roomScoreProviderWorker.checkExistence({
    roomId: someEvent.roomId,
    userId: someEvent.userId,
    h5pId: 'h5pId0',
  })
}

main()
  .then(() => {
    console.log('success')
  })
  .catch((err) => {
    console.error(err)
  })
