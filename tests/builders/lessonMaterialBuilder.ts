import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { FileType } from '../../src/db/cms/enums/fileType'
import { Mutable } from '../utils/mutable'
import ContentBuilder from './contentBuilder'

// TODO: Merge this with ContentBuilder.
export default class LessonMaterialBuilder extends ContentBuilder {
  private rawSourceId = v4()
  private sourceId? = v4()
  private fileType = FileType.H5P
  private contentType: string | undefined
  private readonly sourceMap = new Map([
    [FileType.H5P, this.rawSourceId],
    [FileType.Image, `assets-${this.rawSourceId}.gif`],
    [FileType.Video, `assets-${this.rawSourceId}.mp4`],
    [FileType.Document, `assets-${this.rawSourceId}.pdf`],
    [FileType.Audio, `assets-${this.rawSourceId}.mp3`],
  ])

  public withSource(fileType: FileType, id?: string): this {
    this.fileType = fileType
    this.sourceId = id ?? this.sourceMap.get(fileType)
    return this
  }

  public withUndefinedH5pId(): this {
    this.fileType = FileType.H5P
    this.sourceId = undefined
    return this
  }

  public withContentType(value?: string): this {
    this.contentType = value
    return this
  }

  public build(): Content {
    const entity = super.build()
    entity.type = this.contentType
    const mutableEntity: Mutable<Content> = entity
    if (this.isDataDefined) {
      const data: unknown = {
        source: this.sourceId,
        file_type: this.fileType.valueOf(),
        input_source: 1,
      }
      entity['populateH5pId'](data as JSON)
    }
    return entity
  }
}
