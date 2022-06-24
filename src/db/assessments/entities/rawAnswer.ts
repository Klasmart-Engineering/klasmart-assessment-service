import { Column, Entity, PrimaryColumn } from 'typeorm'
import { Base } from './base'

@Entity({ name: 'assessment_xapi_raw_answer' })
export class RawAnswer extends Base {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly roomId!: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly studentId!: string

  @PrimaryColumn({ name: 'h5p_id', nullable: false })
  public readonly h5pId!: string

  @Column({ name: 'h5p_sub_id', type: 'varchar', nullable: true })
  public readonly h5pSubId?: string | null

  @PrimaryColumn({
    name: 'timestamp',
    type: 'bigint',
    default: 0,
    transformer: {
      to: (entityValue: number) => entityValue,
      from: (databaseValue: string): number => Number(databaseValue),
    },
  })
  public readonly timestamp!: number

  @Column({ type: 'varchar', nullable: true })
  public answer?: string | null

  @Column({ type: 'int4', nullable: true })
  public score?: number | null

  @Column({ name: 'minimum_possible_score', type: 'int4', nullable: true })
  public minimumPossibleScore?: number | null

  @Column({ name: 'maximum_possible_score', type: 'int4', nullable: true })
  public maximumPossibleScore?: number | null
}
