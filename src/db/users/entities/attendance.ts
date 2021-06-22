import { Column, Entity, PrimaryColumn, Index } from 'typeorm'

//Shared by kidsloop-live-server
// TODO: Create a shared repository
@Entity()
export class Attendance {
  @PrimaryColumn({ name: 'session_id' })
  public readonly sessionId!: string

  @PrimaryColumn({
    name: 'join_timestamp',
    transformer: {
      // Needed to acheive correct results during local development.
      // This column type is set as timestamp, but timestamptz would have been a better choice.
      // "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29"
      // timestamp works okay when dates are written and read from the same timezone.
      // The issue occurs when a date is written in one timezone, and read in another.
      // To verify this behavior for yourself in a test project, change your system timezone to UTC,
      // write a date to postgres, change your system timezone back, and read the value.
      to: (value: Date) =>
        new Date(value.getTime() + value.getTimezoneOffset() * 60000),
      from: (value: Date) =>
        new Date(value.getTime() - value.getTimezoneOffset() * 60000),
    },
  })
  public joinTimestamp!: Date

  @PrimaryColumn({
    name: 'leave_timestamp',
    // Needed to acheive correct results during local development.
    // This column type is set as timestamp, but timestamptz would have been a better choice.
    // "https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp_.28without_time_zone.29"
    // timestamp works okay when dates are written and read from the same timezone.
    // The issue occurs when a date is written in one timezone, and read in another.
    // To verify this behavior for yourself in a test project, change your system timezone to UTC,
    // write a date to postgres, change your system timezone back, and read the value.
    transformer: {
      to: (value: Date) =>
        new Date(value.getTime() + value.getTimezoneOffset() * 60000),
      from: (value: Date) =>
        new Date(value.getTime() - value.getTimezoneOffset() * 60000),
    },
  })
  public leaveTimestamp!: Date

  @Index()
  @Column({ name: 'room_id' })
  public readonly roomId!: string

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public readonly userId!: string
}
