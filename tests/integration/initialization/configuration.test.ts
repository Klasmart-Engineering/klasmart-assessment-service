import { Configuration } from '../../../src/initialization/configuration'
import expect from '../../utils/chaiAsPromisedSetup'

describe('configuration', function () {
  const requiredEnvironmentVariables = [
    'DOMAIN',
    'CMS_API_URL',
    'H5P_API_URL',
    'ASSESSMENT_DATABASE_URL',
  ]
  requiredEnvironmentVariables.forEach((envVar) => {
    context(`${envVar} is undefined`, () => {
      let originalValue: string | undefined

      before(() => {
        originalValue = process.env[envVar]
        delete process.env[envVar]
      })

      after(() => {
        resetEnvironmentVariable(envVar, originalValue)
      })

      it('throws configuration error', async () => {
        // Act
        const fn = () => new Configuration()

        // Assert
        expect(fn, `envVar: ${envVar}`).to.throw(
          `❌ Environment variable '${envVar}' needs to be defined`,
        )
      })
    })
  })
})

function resetEnvironmentVariable(
  envVar: string,
  originalValue: string | undefined,
) {
  if (originalValue == undefined) {
    delete process.env[envVar]
  } else {
    process.env[envVar] = originalValue
  }
}
