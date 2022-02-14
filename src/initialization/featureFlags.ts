import { withLogger } from 'kidsloop-nodejs-logger'

const logger = withLogger('featureFlags')

export class FeatureFlags {
  UseCreatedAtUpdatedAtVersionColumns!: boolean

  constructor() {
    this.reset()
  }

  reset() {
    this.UseCreatedAtUpdatedAtVersionColumns = true
    this.logAllFlags()
  }

  logAllFlags() {
    logger.info('')
    logger.info('🚩 FEATURE FLAGS:')
    logger.info('-----------------')
    logger.info(
      `UseCreatedAtUpdatedAtVersionColumns: ${this.UseCreatedAtUpdatedAtVersionColumns}`,
    )
    // add more flags here ...
    logger.info('-----------------')
  }
}

export const featureFlags = new FeatureFlags()

export const getFeatureFlags = (): FeatureFlags => featureFlags
