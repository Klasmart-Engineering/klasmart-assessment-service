import { getRepository } from 'typeorm'
import { UserInputError } from 'apollo-server-express'
import fetch from 'node-fetch'

import { Schedule } from './db/cms/entities'
import { Attendance } from './db/users/entities'

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
  studentId?: string
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
    { roomId, studentId }: PermissionContext,
    permission: Permission,
  ): Promise<boolean> {
    if (this.isAdmin) {
      return true
    }

    const schedule = await getRepository(Schedule, 'cms').findOne(roomId)
    if (!schedule) {
      throw new UserInputError(
        `Room(${roomId}) cannot be found in the Schedule`,
      )
    }
    const organizationId = schedule.orgId

    // send a request to the user-service to check permissions
    // (organizationId, this.currentUserId, permissionName)
    const query = generatePermissionQuery(
      this.currentUserId,
      organizationId,
      permission,
    )

    // query the permission service (promise)
    const fetchPromise = fetch('https://api.alpha.kidsloop.net/user/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    // check memeberships (promise)
    const isRoomMemberQuery = async () => {
      if (studentId) {
        const users = await getRepository(Attendance, 'users')
          .createQueryBuilder('a')
          .select('a.user_id')
          .where('a.room_id = :id', { id: roomId })
          .andWhere('a.user_id IN(:...ids)', {
            ids: [studentId, this.currentUserId],
          })
          .groupBy('a.user_id')
          .getRawMany()
        return users.length == 2
      } else {
        const rooms = await getRepository(Attendance, 'users').find({
          roomId,
          userId: this.currentUserId,
        })
        return rooms.length > 0
      }
    }
    const isRoomMemberPromise = isRoomMemberQuery()

    // process
    const response = await fetchPromise
    if (
      !(
        response.ok &&
        (await response.json())?.data?.user?.membership?.checkAllowed
      )
    ) {
      return false
    }

    const isRoomMember = await isRoomMemberPromise
    return isRoomMember
  }
}

// Execution time (hr): 1s 868.021462ms
// Execution time (hr): 1s 864.53226ms
//Execution time (hr): 1s 824.027429ms

// Execution time (hr): 3s 68.822625ms
// Execution time (hr): 2s 745.478719ms
// Execution time (hr): 2s 486.919644ms
