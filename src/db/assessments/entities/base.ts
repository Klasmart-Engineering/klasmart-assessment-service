import {
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm'

class BaseWithCreatedUpdatedCols extends BaseEntity {
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  public readonly createdAt!: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  public readonly updatedAt!: Date
}

export class BaseWithVersionCol extends BaseEntity {
  @VersionColumn()
  public readonly version!: number
}

class BaseWithCreatedUpdatedVersionCols extends BaseWithCreatedUpdatedCols {
  @VersionColumn()
  public readonly version!: number
}

export const Base = BaseWithCreatedUpdatedVersionCols
