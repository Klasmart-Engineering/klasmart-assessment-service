import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { OrganizationMembership } from './organizationMembership'

@Entity()
export class Organization extends BaseEntity {
  @PrimaryColumn('uuid')
  public organization_id!: string

  @Column({ nullable: true })
  public organization_name?: string

  @OneToMany(
    () => OrganizationMembership,
    (membership) => membership.organization,
  )
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  public memberships?: Promise<OrganizationMembership[]>
}
