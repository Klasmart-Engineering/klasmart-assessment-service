import { UserInputError } from 'apollo-server-express'
import {
  Arg,
  FieldResolver,
  Query,
  Resolver,
  Root,
  Authorized,
} from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'

import { Room, UserContentScore } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'
import { Attendance } from '../db/users/entities'
import { ContentScores, UserScores, TeacherCommentsByStudent } from '../graphql'
import { RoomScoresCalculator } from '../helpers/roomScoresCalculator'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { Schedule } from '../db/cms/entities'
import { ErrorMessage } from '../helpers/errorMessages'
import { LessonPlan } from '../db/cms/entities/lessonPlan'
import { LessonPlanItem } from '../db/cms/entities/lessonPlanItem'

@Service()
@Resolver(() => Room)
export default class RoomResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assessmentDB: EntityManager,
    @InjectManager(USERS_CONNECTION_NAME)
    private readonly userDB: EntityManager,
    @InjectManager(CMS_CONNECTION_NAME)
    private readonly cmsDB: EntityManager,
    private readonly roomScoresCalculator: RoomScoresCalculator,
  ) {}

  @Authorized()
  @Query(() => Room)
  public async Room(
    @Arg('room_id', { nullable: true }) roomId: string,
  ): Promise<Room> {
    try {
      let room = await this.assessmentDB.findOne(Room, roomId, {})
      if (!room) {
        room = new Room(roomId)
      }

      const scores = await this.calculateRoom(room)
      room.scores = Promise.resolve(scores)
      room.recalculate = scores.length == 0
      await this.assessmentDB.save(room)
      return room
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  private async calculateRoom(room: Room): Promise<UserContentScore[]> {
    const roomId = room.roomId
    const attendances = await this.userDB.find(Attendance, {
      where: { roomId },
    })

    const schedule = await this.cmsDB.findOne(Schedule, {
      where: { id: roomId },
    })
    if (!schedule) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
    }
    const lessonPlanId = schedule.lessonPlanId
    const lessonPlan = await this.cmsDB.findOne(LessonPlan, {
      where: { contentId: lessonPlanId },
    })

    if (!lessonPlan?.data) {
      console.warn(`lesson plan (${lessonPlanId}) not found`)
      return []
    }
    const list = []
    const q = []
    q.push(lessonPlan.data)
    while (q.length > 0) {
      const current = q.shift()
      let next: JSON[] | undefined
      if (current && 'next' in current) {
        next = current['next'] as JSON[]
        delete current['next']
      }
      if (next) {
        next.forEach((x) => q.push(x))
      }
      list.push(new LessonPlanItem(current))
    }
    const materialIds = list.map((x) => x.materialId)

    const userContentScores = await this.roomScoresCalculator.calculate(
      roomId,
      attendances,
      materialIds,
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
      const userScores = scoresByUser.get(userContentScore.studentId)
      if (userScores) {
        userScores.scores.push(userContentScore)
      } else {
        scoresByUser.set(
          userContentScore.studentId,
          new UserScores(userContentScore.studentId, [userContentScore]),
        )
      }
    }

    return [...scoresByUser.values()]
  }

  @FieldResolver(() => [ContentScores])
  public async scoresByContent(@Root() room: Room): Promise<ContentScores[]> {
    const scoresByContent: Map<string, ContentScores> = new Map()

    for (const userContentScore of await room.scores) {
      const contentScores = scoresByContent.get(userContentScore.studentId)
      if (contentScores) {
        contentScores.scores.push(userContentScore)
      } else {
        scoresByContent.set(
          userContentScore.studentId,
          new ContentScores(
            userContentScore.contentKey,
            [userContentScore],
            userContentScore.contentType,
            userContentScore.contentName,
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
      const teacherComments = commentsByStudent.get(comment.studentId)
      if (teacherComments) {
        teacherComments.teacherComments.push(comment)
      } else {
        commentsByStudent.set(
          comment.studentId,
          new TeacherCommentsByStudent(comment.studentId, [comment]),
        )
      }
    }

    return [...commentsByStudent.values()]
  }
}
