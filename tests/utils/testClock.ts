import { IClock } from '../../src/cache'

export class TestClock implements IClock {
  constructor(private currentMs = 0) {}

  now(): number {
    return this.currentMs
  }

  public addMs(ms: number) {
    this.currentMs += ms
  }
}
