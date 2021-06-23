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
  @PrimaryColumn('uuid', { name: 'organization_id' })
  public organizationId!: string

  @Column({ name: 'organization_name', nullable: true })
  public organizationName?: string

  @OneToMany(
    () => OrganizationMembership,
    (membership) => membership.organization,
  )
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  public memberships?: Promise<OrganizationMembership[]>
}
