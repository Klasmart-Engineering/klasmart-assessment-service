import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('featureFlags')

export class FeatureFlags {
  constructor() {
    this.reset()
  }

  reset() {
    this.logAllFlags()
  }

  logAllFlags() {
    logger.info('')
    logger.info('🚩 FEATURE FLAGS:')
    logger.info('-----------------')
    // add more flags here ...
    logger.info('-----------------')
  }
}

export const featureFlags = new FeatureFlags()

export const getFeatureFlags = (): FeatureFlags => featureFlags
