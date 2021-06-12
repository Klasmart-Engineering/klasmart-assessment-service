import { Column, Entity, PrimaryColumn, Index } from 'typeorm'

//Shared by kidsloop-live-server
// TODO: Create a shared repository
@Entity()
export class Attendance {
  @PrimaryColumn({ name: 'session_id' })
  public readonly sessionId!: string

  @PrimaryColumn({ name: 'join_timestamp' })
  public joinTimestamp!: Date

  @PrimaryColumn({ name: 'leave_timestamp' })
  public leaveTimestamp!: Date

  @Index()
  @Column({ name: 'room_id' })
  public readonly roomId!: string

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public readonly userId!: string
}
