import 'reflect-metadata'
import { useContainer } from 'typeorm'
import { Container as TypeormTypediContainer } from 'typeorm-typedi-extensions'
import { withLogger } from 'kidsloop-nodejs-logger'
import { connectToAssessmentDatabase } from '../db/assessments/connectToAssessmentDatabase'
import { RoomScoresTemplateProvider2 } from './calculateScores'
import { createXapiEvents } from './helpers'

const logger = withLogger('calculateScores.test')

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
  const rawXapiEvents = createXapiEvents({})

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
