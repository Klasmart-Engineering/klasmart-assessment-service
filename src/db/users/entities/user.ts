import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  public userId!: string

  // Needs to be deprecated
  public userName = (): string => `${this.givenName} ${this.familyName}`
  public fullName = (): string => `${this.givenName} ${this.familyName}`

  @Column({ name: 'given_name', nullable: true })
  public givenName?: string

  @Column({ name: 'family_name', nullable: true })
  public familyName?: string

  @Column({ name: 'username', nullable: true })
  public username?: string

  @Column({ name: 'email', nullable: true })
  public email?: string
}
