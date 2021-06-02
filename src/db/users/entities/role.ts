import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  BaseEntity,
} from 'typeorm'
import { SchoolMembership } from './schoolMembership'

@Entity()
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public role_id!: string

  @Column({ nullable: true })
  public role_name?: string

  @ManyToMany(() => SchoolMembership, (membership) => membership.roles)
  @JoinTable()
  public schoolMemberships?: Promise<SchoolMembership[]>
}
