import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { XApiRecordSql } from '../../src/db/xapi/sql/entities'
import { XAPI_CONNECTION_NAME } from '../../src/db/xapi/sql/connectToXApiDatabase'
import { XApiRecord } from '../../src/db/xapi'

export default class XApiRecordBuilder {
  private userId?: string = v4()
  private serverTimestamp: number = Date.now()
  private clientTimestamp?: number = Date.now()
  private response: string | undefined
  private score: { min: number; max: number; raw: number } | undefined
  private h5pId?: string = v4()
  private h5pSubId?: string
  private h5pType? = 'Flashcards'
  private h5pName? = 'My Activity'
  private verb = 'answered'

  public withUserId(value?: string): this {
    this.userId = value
    return this
  }

  public withServerTimestamp(value: number): this {
    this.serverTimestamp = value
    return this
  }

  public withClientTimestamp(value?: number): this {
    this.clientTimestamp = value
    return this
  }

  public withResponse(value?: string): this {
    this.response = value
    return this
  }

  public withScore(value?: { min: number; max: number; raw: number }): this {
    this.score = value
    return this
  }

  public withH5pId(value?: string): this {
    this.h5pId = value
    return this
  }

  public withH5pSubId(value?: string): this {
    this.h5pSubId = value
    return this
  }

  public withH5pType(value?: string): this {
    this.h5pType = value
    return this
  }

  public withH5pName(value?: string): this {
    this.h5pName = value
    return this
  }

  public withVerb(
    value:
      | 'attempted'
      | 'answered'
      | 'interacted'
      | 'completed'
      | 'progressed'
      | 'passed',
  ): this {
    this.verb = value
    return this
  }

  public build(): XApiRecord {
    let h5pTypeUrl: string | undefined
    if (this.h5pType) {
      h5pTypeUrl = `http://h5p.org/libraries/H5P.${this.h5pType}-1.2`
    }
    return {
      userId: this.userId,
      serverTimestamp: this.serverTimestamp,
      xapi: {
        clientTimestamp: this.clientTimestamp,
        data: {
          statement: {
            verb: { display: { 'en-US': this.verb } },
            object: {
              definition: {
                name: { 'en-US': this.h5pName },
                extensions: {
                  'http://h5p.org/x-api/h5p-local-content-id': this.h5pId,
                  'http://h5p.org/x-api/h5p-subContentId': this.h5pSubId,
                },
              },
            },
            context: {
              contextActivities: {
                category: [
                  {
                    id: h5pTypeUrl,
                  },
                ],
              },
            },
            result: {
              score: this.score,
              response: this.response,
            },
          },
        },
      },
    }
  }

  // public async buildAndPersist(): Promise<XApiRecordSql> {
  //   console.log('XApiSqlRecordBuilder ===> start', { this: this })
  //   const entity = this.build()
  //   console.log({ entity })
  //   return await getRepository(XApiRecordSql, XAPI_CONNECTION_NAME).save(entity)
  // }
}
