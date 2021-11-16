import 'reflect-metadata'
import 'newrelic'

import { createH5pIdToCmsContentIdCache } from './helpers/getContent'
import createAssessmentServer from './helpers/createAssessmentServer'
import registerAndConnectToDataSources from './helpers/registerAndConnectToDataSources'

async function main() {
  await registerAndConnectToDataSources()
  await createH5pIdToCmsContentIdCache()

  const { app, server } = await createAssessmentServer()

  const port = process.env.PORT || 8080
  app.listen(port, () => {
    console.log(
      `🌎 Server ready at http://localhost:${port}${server.graphqlPath}`,
    )
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(-1)
})
