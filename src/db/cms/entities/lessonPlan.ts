import { Column, Entity, PrimaryColumn } from 'typeorm'
import { ContentType } from '../enums/contentType'

@Entity({ name: 'cms_contents' })
export class LessonPlan {
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
}
