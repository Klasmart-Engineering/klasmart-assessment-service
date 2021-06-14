import { Field, ObjectType } from 'type-graphql'
import { Entity, Column, PrimaryColumn, OneToMany, JoinColumn } from 'typeorm'

import { OrganizationMembership } from './organizationMembership'

@ObjectType()
@Entity()
export class User {
  @PrimaryColumn('uuid', { name: 'user_id' })
  @Field()
  public readonly user_id!: string

  @Column({ name: 'given_name', nullable: true })
  @Field({ nullable: true })
  public readonly given_name?: string

  @Column({ name: 'family_name', nullable: true })
  @Field({ nullable: true })
  public readonly family_name?: string

  @Column({ nullable: true })
  public readonly email?: string

  @OneToMany(() => OrganizationMembership, (membership) => membership.user)
  @JoinColumn({
    name: 'organization_id',
    referencedColumnName: 'organization_id',
  })
  public memberships?: Promise<OrganizationMembership[]>
}
