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
import { EntityManager } from 'typeorm'
import { InjectManager } from 'typeorm-typedi-extensions'
import { Logger } from 'winston'
import { withLogger } from 'kidsloop-nodejs-logger'

import { Context, UserID } from '../auth/context'
import { TeacherScore, UserContentScore } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { Content } from '../db/cms/entities/content'
import getContent from '../helpers/getContent'
import ContentKey from '../helpers/contentKey'
import { ErrorMessage } from '../helpers/errorMessages'
import { UserProvider } from '../providers/userProvider'
import { CmsContentProvider } from '../providers/cmsContentProvider'
import { User } from '../web/user'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      TeacherScoreResolver._logger ||
      (TeacherScoreResolver._logger = withLogger('TeacherScoreResolver'))
    )
  }

  constructor(
    private readonly userProvider: UserProvider,
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assesmentDB: EntityManager,
    private readonly cmsContentProvider: CmsContentProvider,
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
        const content = await this.cmsContentProvider.getLessonMaterial(
          contentId,
          context.encodedAuthenticationToken,
        )
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
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.teacherId,
      context.encodedAuthenticationToken,
    )
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherScore,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: TeacherScore,
    @Ctx() context: Context,
  ): Promise<Content | null> {
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
      this.cmsContentProvider,
      context.encodedAuthenticationToken,
    )
  }
}
