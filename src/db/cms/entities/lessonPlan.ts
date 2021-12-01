import { AfterLoad, Column, Entity, PrimaryColumn } from 'typeorm'
import { ContentType } from '../enums/contentType'

@Entity({ name: 'cms_contents' })
export class LessonPlan {
  private _materialIds: string[] = []

  @PrimaryColumn({ name: 'id' })
  readonly contentId!: string

  @Column('enum', { name: 'content_type', enum: ContentType })
  readonly contentType!: ContentType

  @Column({ type: 'json', name: 'data', nullable: true })
  readonly data?: JSON

  @Column({ name: 'content_name' })
  readonly name!: string

  @Column({ name: 'author' })
  readonly author!: string

  @Column({ type: 'bigint', name: 'create_at' })
  readonly createdAt!: number

  public get materialIds(): ReadonlyArray<string> {
    return this._materialIds
  }

  @AfterLoad()
  populateMaterialIds(): void {
    const node = this.data as unknown as ILessonMaterialNode

    this._materialIds = []
    const q: ILessonMaterialNode[] = []
    q.push(node)
    while (q.length > 0) {
      const current = q.shift()
      if (current) {
        current.next?.forEach((x) => q.push(x))
        this._materialIds.push(current.materialId)
      }
    }
  }
}

interface ILessonMaterialNode {
  materialId: string
  next?: ILessonMaterialNode[]
}
