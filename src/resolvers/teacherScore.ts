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
import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'

import { Context, UserID } from '../auth/context'
import { TeacherScore, UserContentScore } from '../db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { Content } from '../db/cms/entities/content'
import CustomizedContentProvider from '../providers/customizedContentProvider'
import ContentKey from '../helpers/contentKey'
import { ErrorMessage } from '../helpers/errorMessages'
import { CmsContentProvider } from '../providers/cmsContentProvider'

const logger = withLogger('TeacherScoreResolver')

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  constructor(
    @InjectManager(ASSESSMENTS_CONNECTION_NAME)
    private readonly assesmentDB: EntityManager,
    private readonly cmsContentProvider: CmsContentProvider,
    private readonly contentProvider: CustomizedContentProvider,
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
    logger.debug(
      `Mutation >> setScore >> roomId: ${roomId}, studentId: ${studentId}, ` +
        `contentId: ${contentId}, score: ${score}, teacherId: ${teacherId}, ` +
        `subcontentId: ${subcontentId}`,
    )
    try {
      const contentKey = ContentKey.construct(contentId, subcontentId)
      const userContentScore = await this.assesmentDB.findOne(
        UserContentScore,
        {
          roomId: roomId,
          studentId: studentId,
          contentKey: contentKey,
        },
      )

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
      logger.error(e)
      throw e
    }
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: TeacherScore,
    @Ctx() context: Context,
  ): Promise<Content | null> {
    logger.debug(
      `TeacherScore { roomId: ${source.roomId}, studentId: ${source.studentId}, ` +
        `contentKey: ${source.contentKey} } >> content`,
    )
    const userContentScore = await source.userContentScore
    if (userContentScore?.content) {
      return userContentScore.content
    }
    const contentType = userContentScore?.contentType
    const contentName = userContentScore?.contentName
    const contentParentId = userContentScore?.contentParentId
    return await this.contentProvider.getContent(
      source.contentKey,
      contentType,
      contentName,
      contentParentId,
      context.encodedAuthenticationToken,
    )
  }
}
