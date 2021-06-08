import { AuthenticationError, UserInputError } from 'apollo-server-express'
import { Arg, FieldResolver, Query, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'

import { Room, UserContentScore } from '../db/assessments/entities'
import { Attendance } from '../db/users/entities'
import { ContentScores, UserScores, TeacherCommentsByStudent } from '../graphql'
import { RoomScoresCalculator } from '../helpers/roomScoresCalculator'
import { UserID } from './context'

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  constructor(
    @InjectManager('assessments')
    private readonly assessmentDB: EntityManager,
    @InjectManager('users')
    private readonly userDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
  ) {}

  @Query(() => Room)
  public async Room(
    @Arg('room_id', { nullable: true }) room_id: string,
    @UserID() user_id?: string,
  ): Promise<Room> {
    if (!user_id) {
      throw new AuthenticationError('Please authenticate')
    }

    try {
      let room = await this.assessmentDB.findOne(Room, room_id, {})
      if (!room) {
        room = new Room(room_id)
      }

      const scores = await this.calculateRoom(room)
      room.scores = Promise.resolve(scores)
      room.recalculate = scores.length == 0
      await this.assessmentDB.save(room)
      return room
    } catch (e) {
      console.error(e)
    }
    throw new UserInputError(`Unable to fetch Room(${room_id})`)
  }

  private async calculateRoom(room: Room): Promise<UserContentScore[]> {
    const roomId = room.room_id
    const attendances = await this.userDB.find(Attendance, {
      where: { roomId },
    })

    const userContentScores = await this.roomScoresCalculator.calculate(
      roomId,
      attendances,
    )

    for (const x of userContentScores) {
      let answers = (await x.answers) || []
      answers = answers?.sort((left, right): number => {
        if (left.date < right.date) return -1
        if (left.date > right.date) return 1
        return 0
      })
      x.answers = Promise.resolve(answers)
    }

    return userContentScores
  }

  @FieldResolver(() => [UserScores])
  public async scoresByUser(@Root() room: Room): Promise<UserScores[]> {
    const scoresByUser: Map<string, UserScores> = new Map()

    for (const userContentScore of await room.scores) {
      const userScores = scoresByUser.get(userContentScore.student_id)
      if (userScores) {
        userScores.scores.push(userContentScore)
      } else {
        scoresByUser.set(
          userContentScore.student_id,
          new UserScores(userContentScore.student_id, [userContentScore]),
        )
      }
    }

    return [...scoresByUser.values()]
  }

  @FieldResolver(() => [ContentScores])
  public async scoresByContent(@Root() room: Room): Promise<ContentScores[]> {
    const scoresByContent: Map<string, ContentScores> = new Map()

    for (const userContentScore of await room.scores) {
      const contentScores = scoresByContent.get(userContentScore.student_id)
      if (contentScores) {
        contentScores.scores.push(userContentScore)
      } else {
        scoresByContent.set(
          userContentScore.student_id,
          new ContentScores(
            userContentScore.content_id,
            [userContentScore],
            userContentScore.contentType,
          ),
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
      const teacherComments = commentsByStudent.get(comment.student_id)
      if (teacherComments) {
        teacherComments.teacherComments.push(comment)
      } else {
        commentsByStudent.set(
          comment.student_id,
          new TeacherCommentsByStudent(comment.student_id, [comment]),
        )
      }
    }

    return [...commentsByStudent.values()]
  }
}
