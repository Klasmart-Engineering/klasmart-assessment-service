export interface ILogger {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
}

export class ConsoleLogger implements ILogger {
  private className: string

  constructor(className: string) {
    this.className = className
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
    console[logLevel](`[${this.className}] ${message}`)
  }
}

export class Logger {
  private static factory: (className: string) => ILogger = (
    className: string,
  ) => new ConsoleLogger(className)
  private static loggerMap = new Map<string, ILogger>()

  public static get(className: string): ILogger {
    let logger = this.loggerMap.get(className)
    if (!logger) {
      logger = Logger.factory(className)
      this.loggerMap.set(className, logger)
    }
    return logger
  }

  public static register(factory: (className: string) => ILogger): void {
    this.factory = factory
  }
}
