import { MiddlewareFn } from 'type-graphql'
import { withLogger } from 'kidsloop-nodejs-logger'

const logger = withLogger('benchmarkMiddleware')

export const Benchmark: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now()
  await next()
  const resolveTime = Date.now() - start
  logger.info(`${info.parentType.name}.${info.fieldName} [${resolveTime} ms]`)
}
