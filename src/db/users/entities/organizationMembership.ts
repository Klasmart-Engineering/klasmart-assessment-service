import { Entity, ManyToOne, PrimaryColumn, BaseEntity } from 'typeorm'
import { User } from './user'
import { Organization } from './organization'

export const MEMBERSHIP_SHORTCODE_MAXLEN = 16
@Entity()
export class OrganizationMembership extends BaseEntity {
  @PrimaryColumn()
  public user_id!: string

  @PrimaryColumn()
  public organization_id!: string

  @ManyToOne(() => User, (user) => user.memberships)
  public user?: Promise<User>

  @ManyToOne(() => Organization, (organization) => organization.memberships)
  public organization?: Promise<Organization>
}
