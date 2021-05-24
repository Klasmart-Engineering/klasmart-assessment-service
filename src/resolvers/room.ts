import { Arg, FieldResolver, Query, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager, Repository } from 'typeorm'
import { InjectRepository, InjectManager } from 'typeorm-typedi-extensions'
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
    @InjectManager('assessments')
    private readonly assessmentDB: EntityManager,
    @InjectManager('users')
    private readonly userDB: EntityManager,
  ) {}

  @Query(() => Room)
  public async Room(@Arg('room_id', { nullable: true }) room_id: string) {
    try {
      let room = await this.assessmentDB.findOne(Room, room_id, {})
      if (room) {
        if (!room.recalculate) {
          return room
        }
        room.scores = this.calculateRoom(room)
        room.recalculate = false
        await this.assessmentDB.save(room)
      } else {
        room = new Room(room_id)
        room.scores = this.calculateRoom(room)
        await this.assessmentDB.insert(Room, room)
      }
      return room
    } catch (e) {
      console.error(e)
    }
    throw new Error(`Unable to fetch Room(${room_id})`)
  }

  private async calculateRoom(room: Room) {
    const roomId = room.room_id
    const userContentScores = new Map<string, UserContentScore>()
    const attendances = await this.userDB.find(Attendance, {
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
              room,
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
              new Date(clientTimestamp),
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
    }
    return [...userContentScores.values()]
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
          new UserScores(userContentScore.user, [userContentScore]),
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
