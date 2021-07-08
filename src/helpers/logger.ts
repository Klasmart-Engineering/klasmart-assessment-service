export interface ILogger {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

export class ConsoleLogger implements ILogger {
  private key: string

  constructor(className: string) {
    this.key = className
  }

  public debug(message: string): void {
    this.log('debug', message)
  }
  public info(message: string): void {
    this.log('info', message)
  }
  public warn(message: string): void {
    this.log('warn', message)
  }
  public error(message: string): void {
    this.log('error', message)
  }

  private log(
    logLevel: 'debug' | 'info' | 'warn' | 'error',
    message: string,
  ): void {
    console[logLevel](`[${this.key}] ${message}`)
  }
}

export class Logger {
  private static factory: (key: string) => ILogger = (key: string) =>
    new ConsoleLogger(key)
  private static loggerMap = new Map<string, ILogger>()

  public static get(key = 'Default'): ILogger {
    let logger = this.loggerMap.get(key)
    if (!logger) {
      logger = Logger.factory(key)
      this.loggerMap.set(key, logger)
    }
    return logger
  }

  public static register(factory: (key: string) => ILogger): void {
    this.factory = factory
  }

  private static clearCache() {
    Logger.loggerMap.clear()
  }
}
