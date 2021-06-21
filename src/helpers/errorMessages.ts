import { Permission } from '../auth/permissions'

export class ErrorMessage {
  static readonly notAuthenticated = `User not authenticated. Please authenticate to proceed`

  static permission(
    userId: string | undefined,
    permission: Permission,
  ): string {
    return `User(${userId}) does not have Permission(${permission})`
  }

  static scheduleNotFound(roomId: string): string {
    return `Room(${roomId}) cannot be found in the Schedule`
  }
}
