import {
  Column,
  PrimaryGeneratedColumn,
  Check,
  Entity,
  Unique,
  OneToMany,
  getRepository,
  JoinColumn,
  ManyToMany,
  BaseEntity,
} from 'typeorm'
import { SchoolMembership } from './schoolMembership'
import { Role } from './role'

@Entity()
@Check(`"school_name" <> ''`)
@Unique(['school_name'])
export class School extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public readonly school_id!: string

  @Column({ nullable: false })
  public school_name!: string

  @OneToMany(() => SchoolMembership, (membership) => membership.school)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  public memberships?: Promise<SchoolMembership[]>

  @ManyToMany(() => Role, (role) => role.schoolMemberships)
  public roles?: Promise<Role[]>

  public async membership({
    user_id,
  }: any): Promise<SchoolMembership | undefined> {
    try {
      const membership = await getRepository(SchoolMembership).findOneOrFail({
        where: { user_id, school_id: this.school_id },
      })
      return membership
    } catch (e) {
      console.error(e)
    }
  }
}
