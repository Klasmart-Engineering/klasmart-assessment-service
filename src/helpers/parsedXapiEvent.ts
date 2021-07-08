import { XAPIRecord } from '../db/xapi/repo'
import { ILogger, Logger } from './logger'

type XapiScore = {
  min?: number
  max?: number
  raw?: number
  scaled?: number
}

export class ParsedXapiEvent {
  public readonly userId!: string
  public readonly h5pId!: string
  public readonly timestamp!: number
  public readonly h5pSubId?: string
  public readonly h5pType?: string
  public readonly h5pName?: string
  public readonly verb?: string
  public readonly score?: XapiScore
  public readonly response?: string

  public static parseRawEvent(
    roomId: string,
    rawXapiEvent: XAPIRecord,
  ): ParsedXapiEvent | null {
    try {
      const userId = rawXapiEvent?.userId
      const timestamp = rawXapiEvent?.xapi?.clientTimestamp
      const statement = rawXapiEvent?.xapi?.data?.statement
      const extensions = statement?.object?.definition?.extensions
      const h5pId =
        extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
      const h5pSubId =
        extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

      if (!userId || !h5pId || !timestamp) {
        ParsedXapiEvent.Logger.info(
          `XAPI event didn't include all required info (roomId:${roomId}, userId:${userId}, h5pId:${h5pId}, timestamp:${timestamp}). Skipping...`,
        )
        return null
      }

      const contentTypeCategories =
        statement?.context?.contextActivities?.category
      const categoryId = contentTypeCategories?.[0]?.id

      let h5pType: string | undefined
      if (categoryId) {
        const regex = new RegExp(
          `^http://h5p.org/libraries/H5P.(.+)-\\d+.\\d+$`,
        )
        const results = regex.exec(categoryId)
        h5pType = (results && results[1]) || undefined
      }

      const h5pName = statement?.object?.definition?.name?.['en-US']
      const verb = statement?.verb?.display?.['en-US']
      const response = statement?.result?.response
      const score = statement?.result?.score

      return {
        userId,
        h5pId,
        h5pSubId,
        h5pType,
        h5pName,
        score,
        response,
        verb,
        timestamp,
      }
    } catch (e) {
      ParsedXapiEvent.Logger.error(`Unable to process event: ${e}`)
    }
    return null
  }

  private static _logger: ILogger
  private static get Logger(): ILogger {
    return (
      ParsedXapiEvent._logger ||
      (ParsedXapiEvent._logger = Logger.get('ParsedXapiEvent'))
    )
  }
}
