import {
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm'
import { featureFlags } from '../../../initialization/featureFlags'

const useCreatedUpdatedCols = featureFlags.UseCreatedAtUpdatedAtVersionColumns

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

export const Base = useCreatedUpdatedCols
  ? BaseWithCreatedUpdatedVersionCols
  : BaseEntity
