import { getConnection } from 'typeorm'
import {
  ASSESSMENTS_CONNECTION_NAME,
  connectToAssessmentDatabase,
} from '../src/db/assessments/connectToAssessmentDatabase'
import {
  CMS_CONNECTION_NAME,
  connectToCmsDatabase,
} from '../src/db/cms/connectToCmsDatabase'
import { migrateContentIdColumnsToUseContentIdInsteadOfH5pId } from '../src/helpers/migrateContentIdColumnsToUseContentIdInsteadOfH5pId'

async function main() {
  await connectToCmsDatabase()
  await connectToAssessmentDatabase()
  const cmsDbConnection = getConnection(CMS_CONNECTION_NAME)
  const assessmentDbConnection = getConnection(ASSESSMENTS_CONNECTION_NAME)
  try {
    await migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
      cmsDbConnection,
      assessmentDbConnection,
    )
    console.log('finished')
  } catch (e) {
    console.log(e)
  }
  await cmsDbConnection?.close()
  await assessmentDbConnection?.close()
}

;(async () => {
  await main()
})().catch(async (e) => {
  console.log(e)
})
