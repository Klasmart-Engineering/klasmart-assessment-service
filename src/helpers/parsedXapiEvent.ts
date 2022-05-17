import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { XApiRecord } from '../db/xapi'

const logger = withLogger('ParsedXapiEvent')

type XapiScore = {
  min?: number
  max?: number
  raw?: number
  scaled?: number
}

export class ParsedXapiEvent {
  public readonly userId!: string
  public readonly roomId?: string
  public readonly h5pId!: string
  public readonly timestamp!: number
  public readonly h5pSubId?: string
  public h5pType?: string
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
    const eventRoomId = rawXapiEvent?.roomId
    const timestamp = rawXapiEvent?.xapi?.clientTimestamp
    const statement = rawXapiEvent?.xapi?.data?.statement
    const extensions = statement?.object?.definition?.extensions
    const h5pId =
      extensions && extensions['http://h5p.org/x-api/h5p-local-content-id']
    const h5pSubId =
      extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

    if (!statement?.object?.definition || !userId || !h5pId || !timestamp) {
      logger.info(
        `XAPI event didn't include all required info (roomId:${roomId}, ` +
          `userId:${userId}, h5pId:${h5pId}, timestamp:${timestamp}). Skipping...`,
      )
      return null
    }

    if (eventRoomId !== undefined && eventRoomId !== roomId) {
      logger.info(
        `XAPI event belongs to a different room ${eventRoomId}. Expected room: ${roomId}. Skipping...`,
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
      h5pParentId = fullParentId.substring(parentIdStartIndex)
    } else if (h5pSubId !== undefined) {
      h5pParentId = h5pId
    }

    const h5pName = statement.object.definition.name?.['en-US']
    const verb = statement.verb?.display?.['en-US']
    const response = statement.result?.response
    const score = statement.result?.score

    return {
      userId,
      roomId: eventRoomId,
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
}
