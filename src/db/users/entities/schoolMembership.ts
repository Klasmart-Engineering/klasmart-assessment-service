import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  ManyToMany,
  BaseEntity,
} from 'typeorm'
import { User } from './user'
import { Role } from './role'
import { School } from './school'

@Entity()
export class SchoolMembership extends BaseEntity {
  @PrimaryColumn()
  public user_id!: string

  @PrimaryColumn()
  public school_id!: string

  @ManyToOne(() => User, (user) => user.schoolMemberships)
  public user?: Promise<User>

  @ManyToOne(() => School, (school) => school.memberships)
  public school?: Promise<School>

  @ManyToMany(() => Role, (role) => role.schoolMemberships)
  public roles?: Promise<Role[]>
}
