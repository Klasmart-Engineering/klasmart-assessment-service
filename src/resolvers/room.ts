import { Arg, FieldResolver, Query, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Container } from 'typeorm-typedi-extensions'
import { Room } from '../db/assessments/entities/room'
import { ContentScores } from '../db/assessments/entities/scoresByContent'
import { UserScores } from '../db/assessments/entities/scoresByUser'
import { TeacherCommentsByStudent } from '../db/assessments/entities/teacherCommentsByUser'
import { UserRepo } from '../db/users/repo'

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  @Query(() => Room)
  public async Room(@Arg('room_id', { nullable: true }) room_id: string) {
    return Room.random(room_id)
  }

  @FieldResolver(() => [UserScores])
  public scoresByUser(@Root() room: Room): UserScores[] {
    const scoresByUser: Map<string, UserScores> = new Map()

    for (const userContentScore of room.scores) {
      const userScores = scoresByUser.get(userContentScore.student_id)
      if (userScores) {
        userScores.scores.push(userContentScore)
      } else {
        scoresByUser.set(
          userContentScore.student_id,
          new UserScores(userContentScore.user, [userContentScore]),
        )
      }
    }

    return [...scoresByUser.values()]
  }

  @FieldResolver(() => [ContentScores])
  public scoresByContent(@Root() room: Room): ContentScores[] {
    const scoresByContent: Map<string, ContentScores> = new Map()

    for (const userContentScore of room.scores) {
      const contentScores = scoresByContent.get(userContentScore.student_id)
      if (contentScores) {
        contentScores.scores.push(userContentScore)
      } else {
        scoresByContent.set(
          userContentScore.student_id,
          new ContentScores(userContentScore.content, [userContentScore]),
        )
      }
    }

    return [...scoresByContent.values()]
  }

  @FieldResolver(() => [TeacherCommentsByStudent])
  public async teacherCommentsByStudent(
    @Root() room: Room,
  ): Promise<TeacherCommentsByStudent[]> {
    const commentsByStudent: Map<string, TeacherCommentsByStudent> = new Map()

    for (const comment of await room.teacherComments) {
      const teacherComments = commentsByStudent.get(comment.studentId)
      if (teacherComments) {
        teacherComments.teacherComments.push(comment)
      } else {
        commentsByStudent.set(
          comment.studentId,
          new TeacherCommentsByStudent(comment.student, [comment]),
        )
      }
    }

    return [...commentsByStudent.values()]
  }
}
