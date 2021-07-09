export class ErrorMessage {
  static readonly notAuthenticated = `User not authenticated. Please authenticate to proceed`

  static scheduleNotFound(roomId: string): string {
    return `Room(${roomId}) cannot be found in the Schedule`
  }

  static unknownUser(userId: string): string {
    return `Unknown User(${userId})`
  }

  static unknownUserContentScore(
    roomId: string,
    studentId: string,
    contentId: string,
  ): string {
    return `Unknown UserContentScore(room_id(${roomId}), student_id(${studentId}), content_id(${contentId}))`
  }
}
