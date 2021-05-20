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
  public userRepo = Container.get(UserRepo)

  @Query((type) => Room)
  public async Room(@Arg('room_id', { nullable: true }) room_id: string) {
    const attendances = this.userRepo.searchAttendances({ roomId: room_id })
    // const room: Room = {
    //   room_id,
    // }
    return new Room(room_id)
  }

  @FieldResolver((type) => [UserScores])
  public async scoresByUser(@Root() room: Room) {
    const entries = [...room.scoresByUser.entries()]
    const userScores = entries.map(
      ([user, scores]) => new UserScores(user, scores),
    )
    return userScores
  }

  @FieldResolver((type) => [ContentScores])
  public async scoresByContent(@Root() room: Room) {
    const entries = [...room.scoresByContent.entries()]
    const contentScores = entries.map(
      ([content, scores]) => new ContentScores(content, scores),
    )
    return contentScores
  }

  @FieldResolver((type) => [TeacherCommentsByStudent])
  public async teacherCommentsByStudent(@Root() room: Room) {
    const entries = [...room.teacherCommentsByStudent.entries()]
    const contentScores = entries.map(
      ([student, comments]) => new TeacherCommentsByStudent(student, comments),
    )
    return contentScores
  }
}
