import { MiddlewareFn } from 'type-graphql'
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

const logger = withLogger('benchmarkMiddleware')

export const GqlBenchmark: MiddlewareFn = async ({ info }, next) => {
  const start = Date.now()
  await next()
  const resolveTime = Date.now() - start
  logger.info(`${info.parentType.name}.${info.fieldName} [${resolveTime} ms]`)
}

export function Benchmark(className?: string) {
  return (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    if (!(descriptor.value instanceof Function))
      throw new Error('Decorator only supports methods.')

    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      let result, error

      try {
        result = await originalMethod.apply(this, args)
      } catch (err) {
        error = err
      } finally {
        const duration = Date.now() - startTime
        const prefix = className ? className + '.' : ''
        logger.info(`${prefix}${propertyKey} [${duration} ms]`)
      }

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result
    }

    return descriptor
  }
}
