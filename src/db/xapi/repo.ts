import { XApiRecord } from './interfaces'

export interface IXApiRepository {
  searchXApiEvents(
    userId: string,
    from?: number,
    to?: number,
  ): Promise<XApiRecord[]>
}
