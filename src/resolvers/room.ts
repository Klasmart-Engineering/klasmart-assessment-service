import { Arg, FieldResolver, Query, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Answer } from '../db/assessments/entities/answer'
import { Content } from '../db/assessments/entities/material'
import { Room } from '../db/assessments/entities/room'
import { ContentScores } from '../db/assessments/entities/scoresByContent'
import { UserScores } from '../db/assessments/entities/scoresByUser'
import { TeacherCommentsByStudent } from '../db/assessments/entities/teacherCommentsByUser'
import { User } from '../db/assessments/entities/user'
import { UserContentScore } from '../db/assessments/entities/userContentScore'
import { Attendance } from '../db/users/entities'
import { XAPIRepository, xapiRepository } from '../db/xapi/repo'

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  private readonly xapiRepository: XAPIRepository = xapiRepository
  constructor(
    @InjectRepository(Room, 'assessments')
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Attendance, 'users')
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  @Query(() => Room)
  public async Room(@Arg('room_id', { nullable: true }) room_id: string) {
    try {
      // const room = await this.roomRepository.findOne(room_id)
      // if(room) { return room }
      const userContentScores = await this.calculateRoom(room_id)
      if (userContentScores) {
        const room = new Room(room_id)
        room.scores = userContentScores
        return room
      }
      return Room.random(room_id)
    } catch (e) {
      console.error(e)
      throw new Error(`Unable to fetch Room(${room_id})`)
    }
  }

  private async calculateRoom(roomId: string) {
    const userContentScores = new Map<string, UserContentScore>()
    const attendances = await this.attendanceRepository.find({
      where: { roomId },
    })

    for (const { userId, joinTimestamp, leaveTimestamp } of attendances) {
      const events = await this.xapiRepository.searchXApiEvents(
        userId,
        joinTimestamp.getTime(),
        leaveTimestamp.getTime(),
      )
      if (!events) {
        continue
      }
      for (const event of events) {
        if (!event) {
          continue
        }
        try {
          const clientTimestamp = event?.xapi?.clientTimestamp
          const statement = event?.xapi?.data?.statement
          const extensions = statement?.object?.definition?.extensions
          const localId =
            extensions &&
            extensions['http://h5p.org/x-api/h5p-local-content-id']
          const subContentId =
            extensions && extensions['http://h5p.org/x-api/h5p-subContentId']

          const contentId = `${localId}` //|${subContentId}`
          const contentTypeCategories =
            statement?.context?.contextActivities?.category
          const contentType =
            contentTypeCategories instanceof Array &&
            contentTypeCategories[0]?.id

          const id = `${roomId}|${userId}|${contentId}`
          let userContentScore = userContentScores.get(id)
          if (!userContentScore) {
            userContentScore = UserContentScore.new(
              roomId,
              User.random(userId),
              new Content(contentId, '', contentType),
            )
            userContentScores.set(id, userContentScore)
          }

          userContentScore.seen = true
          const min = statement?.result?.score?.min
          if (min !== undefined) {
            userContentScore.min = min
          }
          const max = statement?.result?.score?.max
          if (max !== undefined) {
            userContentScore.max = max
          }

          const response = statement?.result?.response
          const score = statement?.result?.score?.raw
          if (score !== undefined || response !== undefined) {
            console.log(JSON.stringify({ id, response, score }))
            const answer = Answer.new(
              userContentScore,
              clientTimestamp,
              response,
              score,
              min,
              max,
            )
            userContentScore.addAnswer(answer)
          }
        } catch (e) {
          console.error(`Unable to process event: ${e}`)
        }
      }
      return [...userContentScores.values()]
    }
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
