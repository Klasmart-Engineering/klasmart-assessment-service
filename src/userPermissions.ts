import { Container } from 'typeorm-typedi-extensions'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'
import { EntityManager, Repository } from 'typeorm'
// import { UserRepo } from './db/users/repo'
import { Attendance, User } from './db/users/entities'

export enum PermissionName {
  ADD_COMMENT = 'add_comment',
  ADD_SCORE = 'add_score',
}

interface PermissionContext {
  roomId: string
}

export class UserPermissions {
  static ADMIN_EMAILS = [
    'sandy@calmid.com',
    'pj.williams@calmid.com',
    'emfg@calmid.com',
    'owen.delahoy@calmid.com',
    'mcarey@calmid.com',
    'ncurtis@calmid.com',
    'sbrolia@calmid.com',
    'cabauman@calmid.com',
    'evgeny.roskach@calmid.com',
  ]

  private readonly currentUserId: string
  private readonly email: string
  public readonly isAdmin?: boolean

  //   public userRepo = Container.get(UserRepo)

  public constructor(
    @InjectRepository(Attendance, 'users')
    public readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
    token?: any,
  ) {
    this.currentUserId = token?.id
    this.email = token?.email || ''
    this.isAdmin = this.isAdminEmail(this.email)
  }

  private isAdminEmail(email: string) {
    return UserPermissions.ADMIN_EMAILS.includes(email)
  }

  public getUserId(): string {
    return this.currentUserId
  }

  private async isUserAdmin(userId?: string) {
    const user = await this.userRepository.findOne(userId)

    return this.isAdminEmail(user?.email || '')
  }

  public rejectIfNotAdmin(): void {
    if (!this.isAdminEmail(this.email)) {
      throw new Error(
        `User(${this.currentUserId}) does not have Admin permissions`,
      )
    }
    console.debug(`User ${this.currentUserId} is authenticated`)
  }

  public rejectIfNotAuthenticated(): void {
    if (!this.currentUserId) {
      throw new Error(`User not authenticated. Please authenticate to proceed`)
    }
  }

  public async rejectIfNotAllowed(
    permissionContext: PermissionContext,
    permissionName?: PermissionName,
  ): Promise<void> {
    this.rejectIfNotAuthenticated()
    const isAllowed = await this.allowed(permissionContext, permissionName)

    if (!isAllowed) {
      throw new Error(
        `User(${this.currentUserId}) does not have Permission(${permissionName})`,
      )
    }
  }

  public async allowed(
    { roomId }: PermissionContext,
    permissionName?: PermissionName,
  ): Promise<boolean> {
    const isAdmin = await this.isUserAdmin(this.currentUserId)
    if (isAdmin) {
      return true
    }

    let output = false
    const currentUser = await this.userRepository.findOne(this.currentUserId)
    const rooms = await this.attendanceRepository.find({
      roomId,
      userId: this.currentUserId,
    })
    const currentUserWasInRoom = rooms.length > 0

    if (currentUserWasInRoom) {
      output = true
    }

    if (
      currentUserWasInRoom &&
      (permissionName == PermissionName.ADD_COMMENT ||
        permissionName == PermissionName.ADD_SCORE)
    ) {
      // @TODO: check for specific org associated with the room
      const schoolMemberships = await currentUser?.schoolMemberships
      const roles = (
        await Promise.all(schoolMemberships?.map((x) => x.roles) || [])
      ).flatMap((x) => x?.map((y) => y.role_name))

      if (!roles.includes('Teacher')) {
        output = false
      }
    }

    return output
  }
}
