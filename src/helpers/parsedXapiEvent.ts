import { XApiRecord } from '../db/xapi'
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
  public readonly h5pParentId?: string
  public readonly verb?: string
  public readonly score?: XapiScore
  public readonly response?: string

  public static parseRawEvent(
    roomId: string,
    rawXapiEvent?: XApiRecord,
  ): ParsedXapiEvent | null {
    const userId = rawXapiEvent?.userId
    const timestamp = rawXapiEvent?.xapi?.clientTimestamp
    const statement = rawXapiEvent?.xapi?.data?.statement
    const extensions = statement?.object?.definition?.extensions
    const h5pId =
      extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
    const h5pSubId =
      extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

    if (!statement?.object?.definition || !userId || !h5pId || !timestamp) {
      ParsedXapiEvent.Logger.info(
        `XAPI event didn't include all required info (roomId:${roomId}, userId:${userId}, h5pId:${h5pId}, timestamp:${timestamp}). Skipping...`,
      )
      return null
    }

    const contentTypeCategories = statement.context?.contextActivities?.category
    const categoryId = contentTypeCategories?.[0]?.id

    let h5pType: string | undefined
    if (categoryId) {
      const regex = new RegExp(`^http://h5p.org/libraries/H5P.(.+)-\\d+.\\d+$`)
      const results = regex.exec(categoryId)
      h5pType = (results && results[1]) || undefined
    }

    // For some reason, the 1st level subcontent doesn't include a parentId.
    let h5pParentId: string | undefined
    const fullParentId = statement.context?.contextActivities?.parent?.[0]?.id
    if (fullParentId) {
      const parentIdStartIndex = fullParentId.indexOf('=') + 1
      h5pParentId = fullParentId.substr(parentIdStartIndex)
    } else if (h5pSubId !== undefined) {
      h5pParentId = h5pId
    }

    const h5pName = statement.object.definition.name?.['en-US']
    const verb = statement.verb?.display?.['en-US']
    const response = statement.result?.response
    const score = statement.result?.score

    return {
      userId,
      h5pId,
      h5pSubId,
      h5pType,
      h5pName,
      h5pParentId,
      score,
      response,
      verb,
      timestamp,
    }
  }

  private static _logger: ILogger
  private static get Logger(): ILogger {
    return (
      ParsedXapiEvent._logger ||
      (ParsedXapiEvent._logger = Logger.get('ParsedXapiEvent'))
    )
  }
}
