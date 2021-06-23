import { Field, ObjectType } from 'type-graphql'
import { Entity, Column, PrimaryColumn, OneToMany, JoinColumn } from 'typeorm'

import { OrganizationMembership } from './organizationMembership'

@ObjectType()
@Entity()
export class User {
  @PrimaryColumn('uuid', { name: 'user_id' })
  @Field({ name: 'user_id' })
  public readonly userId!: string

  @Column({ name: 'given_name', nullable: true })
  @Field({ name: 'given_name', nullable: true })
  public readonly givenName?: string

  @Column({ name: 'family_name', nullable: true })
  @Field({ name: 'family_name', nullable: true })
  public readonly familyName?: string

  @Column({ nullable: true })
  public readonly email?: string

  @OneToMany(() => OrganizationMembership, (membership) => membership.user)
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'organization_id',
  })
  public memberships?: Promise<OrganizationMembership[]>
}
