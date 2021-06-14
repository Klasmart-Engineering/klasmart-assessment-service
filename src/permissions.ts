import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository, getRepository } from 'typeorm'
import { UserInputError, gql } from 'apollo-server-express'
import fetch from 'node-fetch'

// import { UserRepo } from './db/users/repo'
import { Schedule } from './db/cms/entities'
import { Attendance, User } from './db/users/entities'

// Permissions to member
// - view: assessments_page_406
// - edit: edit_in_progress_assessment_439
// - unclear: edit_attendance_for_in_progress_assessment_438

export enum Permission {
  assessments_page_406 = 'assessments_page_406',
  edit_in_progress_assessment_439 = 'edit_in_progress_assessment_439',
  edit_attendance_for_in_progress_assessment_438 = 'edit_attendance_for_in_progress_assessment_438',
}

export type PermissionName =
  | 'assessments_page_406'
  | 'edit_in_progress_assessment_439'
  | 'edit_attendance_for_in_progress_assessment_438'

interface PermissionContext {
  roomId: string
}

const generatePermissionQuery = (
  userId: string,
  orgId: string,
  permissionName: string,
) => `
query {
  user(user_id: "${userId}") {
    membership(organization_id: "${orgId}") {
      checkAllowed(permission_name: "${permissionName}")
    }
  }
}
`

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

  public constructor(token?: any) {
    this.currentUserId = token?.id
    this.email = token?.email || ''
    this.isAdmin = this.isAdminEmail(this.email)
  }

  private isAdminEmail(email: string) {
    return UserPermissions.ADMIN_EMAILS.includes(email)
  }

  public rejectIfNotAuthenticated(): void {
    if (!this.currentUserId) {
      throw new Error(`User not authenticated. Please authenticate to proceed`)
    }
  }

  public async rejectIfNotAllowed(
    permissionContext: PermissionContext,
    permission: Permission,
  ): Promise<void> {
    this.rejectIfNotAuthenticated()
    const isAllowed = await this.isAllowed(permissionContext, permission)

    if (!isAllowed) {
      throw new Error(
        `User(${this.currentUserId}) does not have Permission(${permission})`,
      )
    }
  }

  public async isAllowed(
    { roomId }: PermissionContext,
    permission: Permission,
  ): Promise<boolean> {
    const hrstart = process.hrtime()
    console.debug('isAllowed start')
    if (this.isAdmin) {
      return true
    }

    console.debug('isAllowed not admin')
    const schedule = await getRepository(Schedule, 'cms').findOne(roomId)
    if (!schedule) {
      throw new UserInputError(
        `Room(${roomId}) cannot be found in the Schedule`,
      )
    }
    const organizationId = schedule.orgId
    console.debug('isAllowed found schedule', { schedule, organizationId })

    // send a request to the user-service to check permissions
    // (organizationId, this.currentUserId, permissionName)
    const query = generatePermissionQuery(
      this.currentUserId,
      organizationId,
      permission,
    )
    console.debug('isAllowed permission Query', { query })

    // query the permission service (promise)
    const fetchPromise = fetch('https://api.alpha.kidsloop.net/user/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    console.debug('isAllowed fetchPromise started', fetchPromise)

    // check memeberships (promise)
    const isRoomMemberQuery = async () => {
      const rooms = await getRepository(Attendance, 'users').find({
        roomId,
        userId: this.currentUserId,
      })
      return rooms.length > 0
    }
    const isRoomMemberPromise = isRoomMemberQuery()
    console.debug('isAllowed isRoomMemberPromise started', isRoomMemberPromise)

    // process
    const response = await fetchPromise
    const jsonBody = response.clone().json()
    console.debug('isAllowed fetchPromise response', {
      response,
      json: jsonBody,
      jsonType: typeof jsonBody,
    })
    if (
      !(
        response.ok &&
        (await response.json())?.data?.user?.membership?.checkAllowed
      )
    ) {
      console.debug('isAllowed permission denied', { response })
      return false
    }

    console.debug('isAllowed permission accepted')
    const isRoomMember = await isRoomMemberPromise
    console.debug('isAllowed isRoomMember', { isRoomMember })
    const hrend = process.hrtime(hrstart)
    console.debug('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
    return isRoomMember
  }
}

// ===============================
// ===============================
// ===============================
// ===============================

// export class UserPermissions2 {
//   static ADMIN_EMAILS = [
//     'sandy@calmid.com',
//     'pj.williams@calmid.com',
//     'emfg@calmid.com',
//     'owen.delahoy@calmid.com',
//     'mcarey@calmid.com',
//     'ncurtis@calmid.com',
//     'sbrolia@calmid.com',
//     'cabauman@calmid.com',
//     'evgeny.roskach@calmid.com',
//   ]

//   private readonly currentUserId: string
//   private readonly email: string
//   public readonly isAdmin?: boolean

//   //   public userRepo = Container.get(UserRepo)

//   public constructor(
//     @InjectRepository(Attendance, 'users')
//     public readonly attendanceRepository: Repository<Attendance>,
//     @InjectRepository(User, 'users')
//     private readonly userRepository: Repository<User>,
//     token?: any,
//   ) {
//     this.currentUserId = token?.id
//     this.email = token?.email || ''
//     this.isAdmin = this.isAdminEmail(this.email)
//   }

//   private isAdminEmail(email: string) {
//     return UserPermissions.ADMIN_EMAILS.includes(email)
//   }

//   public getUserId(): string {
//     return this.currentUserId
//   }

//   private async isUserAdmin(userId?: string) {
//     const user = await this.userRepository.findOne(userId)

//     return this.isAdminEmail(user?.email || '')
//   }

//   public rejectIfNotAdmin(): void {
//     if (!this.isAdminEmail(this.email)) {
//       throw new Error(
//         `User(${this.currentUserId}) does not have Admin permissions`,
//       )
//     }
//     console.debug(`User ${this.currentUserId} is authenticated`)
//   }

//   public rejectIfNotAuthenticated(): void {
//     if (!this.currentUserId) {
//       throw new Error(`User not authenticated. Please authenticate to proceed`)
//     }
//   }

//   public async rejectIfNotAllowed(
//     permissionContext: PermissionContext,
//     permissionName?: PermissionName,
//   ): Promise<void> {
//     this.rejectIfNotAuthenticated()
//     const isAllowed = await this.allowed(permissionContext, permissionName)

//     if (!isAllowed) {
//       throw new Error(
//         `User(${this.currentUserId}) does not have Permission(${permissionName})`,
//       )
//     }
//   }

//   public async allowed(
//     { roomId }: PermissionContext,
//     permissionName?: PermissionName,
//   ): Promise<boolean> {
//     const isAdmin = await this.isUserAdmin(this.currentUserId)
//     if (isAdmin) {
//       return true
//     }

//     let output = false
//     const currentUser = await this.userRepository.findOne(this.currentUserId)
//     const rooms = await this.attendanceRepository.find({
//       roomId,
//       userId: this.currentUserId,
//     })
//     const currentUserWasInRoom = rooms.length > 0

//     if (currentUserWasInRoom) {
//       output = true
//     }

//     if (
//       currentUserWasInRoom &&
//       (permissionName == PermissionName.ADD_COMMENT ||
//         permissionName == PermissionName.ADD_SCORE)
//     ) {
//       // @TODO: check for specific org associated with the room
//       const schoolMemberships = await currentUser?.schoolMemberships
//       const roles = (
//         await Promise.all(schoolMemberships?.map((x) => x.roles) || [])
//       ).flatMap((x) => x?.map((y) => y.role_name))

//       if (!roles.includes('Teacher')) {
//         output = false
//       }
//     }

//     return output
//   }
// }
