import Substitute from '@fluffy-spoon/substitute'
import { expect } from 'chai'
import { ConsoleLogger, ILogger, Logger } from '../../src/helpers/logger'

describe('helpers.logger', () => {
  before(() => Logger.reset())
  after(() => {
    Logger.reset()
    Logger.register(() => Substitute.for<ILogger>())
  })
  afterEach(() => Logger.reset())

  context('ConsoleLogger', () => {
    it('executes the 4 log levels without throwing', () => {
      const consoleLogger = new ConsoleLogger('UnitTest')
      consoleLogger.debug('debug')
      consoleLogger.error('error')
      consoleLogger.info('info')
      consoleLogger.warn('warn')
    })
  })

  context(`Logger.get(...).debug(...)`, () => {
    it('registered logger receives 1 debug call', () => {
      const logger = Substitute.for<ILogger>()
      Logger.register(() => logger)
      Logger.get('Logger').debug('test')
      logger.received(1).debug('test')
    })
  })

  context(`Logger.get(...)`, () => {
    it('new instance is returned per key', () => {
      Logger.register(() => Substitute.for<ILogger>())
      const logger1 = Logger.get('Logger1')
      const logger2 = Logger.get('Logger2')
      expect(logger1).not.equal(logger2)
    })

    it('same instance is returned for same key', () => {
      Logger.register(() => Substitute.for<ILogger>())
      const logger1 = Logger.get('Logger')
      const logger2 = Logger.get('Logger')
      expect(logger1).equal(logger2)
    })

    it('default logger is of type ConsoleLogger', () => {
      const logger = Logger.get('Logger')
      expect(logger).instanceOf(ConsoleLogger)
    })
  })
})
