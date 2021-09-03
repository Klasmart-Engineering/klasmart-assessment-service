import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { XApiObject } from '../../interfaces'

@Entity({ name: 'xapi_record' })
export class XApiRecordSql {
  @PrimaryColumn({ name: 'user_id' })
  public userId!: string

  @PrimaryColumn({
    type: 'bigint',
    name: 'server_timestamp',
    transformer: {
      to: (entityValue: number) => entityValue,
      from: (databaseValue: string): number => Number(databaseValue),
    },
  })
  serverTimestamp!: number

  @Column({ type: 'json', nullable: true })
  public xapi?: XApiObject
}
