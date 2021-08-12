import { UserInputError } from 'apollo-server-express'
import {
  Mutation,
  Arg,
  Resolver,
  FieldResolver,
  Root,
  Ctx,
  Authorized,
} from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager, Repository } from 'typeorm'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'

import { TeacherScore, UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { User } from '../db/users/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'
import { Context, UserID } from '../auth/context'
import getContent from '../helpers/getContent'
import ContentKey from '../helpers/contentKey'
import { ILogger, Logger } from '../helpers/logger'
import { ErrorMessage } from '../helpers/errorMessages'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  private static _logger: ILogger
  private get Logger(): ILogger {
    return (
      TeacherScoreResolver._logger ||
      (TeacherScoreResolver._logger = Logger.get('TeacherScoreResolver'))
    )
  }

  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assesmentDB: EntityManager,
    @InjectRepository(User, USERS_CONNECTION_NAME)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Content, CMS_CONNECTION_NAME)
    private readonly contentRepository: Repository<Content>,
  ) {}

  @Authorized()
  @Mutation(() => TeacherScore)
  public async setScore(
    @Ctx() context: Context,
    @Arg('room_id') roomId: string,
    @Arg('student_id') studentId: string,
    @Arg('content_id') contentId: string,
    @Arg('score') score: number,
    @UserID() teacherId: string,
    @Arg('subcontent_id', { nullable: true }) subcontentId?: string,
  ): Promise<TeacherScore> {
    try {
      let contentKey = ContentKey.construct(contentId, subcontentId)
      let userContentScore = await this.assesmentDB.findOne(UserContentScore, {
        roomId: roomId,
        studentId: studentId,
        contentKey: contentKey,
      })

      // If the content_id columns haven't been migrated yet
      // (still using h5p ids), we need to try with the h5pId.
      if (!userContentScore) {
        const content = await this.contentRepository.findOne({
          where: { contentId: contentId },
        })
        if (content?.h5pId) {
          contentKey = ContentKey.construct(content.h5pId, subcontentId)
          userContentScore = await this.assesmentDB.findOne(UserContentScore, {
            roomId: roomId,
            studentId: studentId,
            contentKey: contentKey,
          })
        }
      }

      if (!userContentScore) {
        throw new UserInputError(
          ErrorMessage.unknownUserContentScore(roomId, studentId, contentId),
        )
      }

      const teacherScore =
        (await this.assesmentDB.findOne(TeacherScore, {
          roomId: roomId,
          studentId: studentId,
          contentKey: contentKey,
          teacherId: teacherId,
        })) || TeacherScore.new(userContentScore, teacherId, score)

      teacherScore.score = score

      await this.assesmentDB.save(TeacherScore, teacherScore)

      return teacherScore
    } catch (e) {
      this.Logger.error(e)
      throw e
    }
  }

  @FieldResolver(() => User, { nullable: true })
  public async teacher(
    @Root() source: TeacherScore,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { userId: source.teacherId },
    })
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherScore,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { userId: source.studentId },
    })
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(@Root() source: TeacherScore): Promise<Content | null> {
    const userContentScore = await this.assesmentDB.findOne(UserContentScore, {
      where: {
        roomId: source.roomId,
        studentId: source.studentId,
        contentKey: source.contentKey,
      },
    })
    const contentType = userContentScore?.contentType
    const contentName = userContentScore?.contentName
    const contentParentId = userContentScore?.contentParentId
    return await getContent(
      source.contentKey,
      contentType,
      contentName,
      contentParentId,
      this.contentRepository,
    )
  }
}
