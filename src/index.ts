import 'reflect-metadata'
import 'newrelic'
import { withLogger } from 'kidsloop-nodejs-logger'

import createAssessmentServer from './initialization/createAssessmentServer'
import registerAndConnectToDataSources from './initialization/registerAndConnectToDataSources'

const logger = withLogger('main')

async function main() {
  await registerAndConnectToDataSources()

  const { app, server } = await createAssessmentServer()

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    logger.info(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    )
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
