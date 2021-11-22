// import { Entity, ManyToOne, PrimaryColumn, BaseEntity } from 'typeorm'
// import { User } from './user'
// import { Organization } from './organization'

// export const MEMBERSHIP_SHORTCODE_MAXLEN = 16
// @Entity()
// export class OrganizationMembership extends BaseEntity {
//   @PrimaryColumn({ name: 'user_id' })
//   public userId!: string

//   @PrimaryColumn({ name: 'organization_id' })
//   public organizationId!: string

//   @ManyToOne(() => User, (user) => user.memberships)
//   public user?: Promise<User>

//   @ManyToOne(() => Organization, (organization) => organization.memberships)
//   public organization?: Promise<Organization>
// }
