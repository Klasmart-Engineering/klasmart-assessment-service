import { withLogger } from 'kidsloop-nodejs-logger'

const logger = withLogger('featureFlags')

export class FeatureFlags {
  // fix: disconnected UserContentScore nodes
  // https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/cc49d4ed0ba7299a057033774e157e22dbe8d5e7
  // commit 0f60592
  FixDisconnectedUserContentScoreNodes!: boolean
  UseCreatedAtUpdatedAtVersionColumns!: boolean

  constructor() {
    this.reset()
  }

  reset() {
    this.FixDisconnectedUserContentScoreNodes = true
    this.UseCreatedAtUpdatedAtVersionColumns = true
    this.logAllFlags()
  }

  logAllFlags() {
    logger.info('')
    logger.info('🚩 FEATURE FLAGS:')
    logger.info('-----------------')
    logger.info(
      `FixDisconnectedUserContentScoreNodes: ${this.FixDisconnectedUserContentScoreNodes}`,
    )
    logger.info(
      `UseCreatedAtAdnUpdatedAtColumns: ${this.UseCreatedAtUpdatedAtVersionColumns}`,
    )
    // add more flags here ...
    logger.info('-----------------')
  }

  setFixDisconnectedUserContentScoreNodes(value: boolean) {
    this.FixDisconnectedUserContentScoreNodes = value
    logger.info(`🚩 Setting FixDisconnectedUserContentScoreNodes => ${value}`)
  }
}

export const featureFlags = new FeatureFlags()

export const getFeatureFlags = (): FeatureFlags => featureFlags
