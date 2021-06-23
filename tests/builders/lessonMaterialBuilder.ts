import { v4 } from 'uuid'
import { Content } from '../../src/db/cms/entities/content'
import { FileType } from '../../src/db/cms/enums/fileType'
import { Mutable } from '../utils/mutable'
import ContentBuilder from './contentBuilder'

export default class LessonMaterialBuilder extends ContentBuilder {
  private rawSourceId = v4()
  private sourceId? = v4()
  private fileType = FileType.H5P
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

  public build(): Content {
    const entity = super.build()
    entity.h5pId = this.fileType === FileType.H5P ? this.sourceId : undefined
    const mutableEntity: Mutable<Content> = entity
    mutableEntity.data = JSON.parse(
      `{"source": "${
        this.sourceId
      }", "file_type": ${this.fileType.valueOf()}, "input_source": 1}`,
    )
    return entity
  }
}
