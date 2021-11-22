import { Field, ObjectType } from 'type-graphql'
import { Entity, Column, PrimaryColumn, OneToMany, JoinColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryColumn('uuid', { name: 'user_id' })
  public readonly userId!: string

  @Column({ name: 'given_name', nullable: true })
  public readonly givenName?: string

  @Column({ name: 'family_name', nullable: true })
  public readonly familyName?: string

  @Column({ nullable: true })
  public readonly email?: string
}
