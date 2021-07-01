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
import getContent, { findCmsContentIdUsingH5pId } from '../helpers/getContent'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
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
      let fullContentId = subcontentId
        ? `${contentId}|${subcontentId}`
        : contentId
      let userContentScore = await this.assesmentDB.findOne(UserContentScore, {
        roomId: roomId,
        studentId: studentId,
        contentId: fullContentId,
      })

      // If the provided content id is a cms content id, and the db ids
      // haven't been migrated yet, we need to try with the h5pId.
      if (!userContentScore) {
        const content = await this.contentRepository.findOne({
          where: { contentId: contentId },
        })
        if (content?.h5pId) {
          fullContentId = subcontentId
            ? `${content.h5pId}|${subcontentId}`
            : content.h5pId
          userContentScore = await this.assesmentDB.findOne(UserContentScore, {
            roomId: roomId,
            studentId: studentId,
            contentId: fullContentId,
          })
        }
      }

      // Shouldn't be the case anymore because they mentioned switching from passing
      // h5p ids to cms content ids, but just in case, if the contentId is actually
      // an h5p id, let's try searching by that.
      if (!userContentScore) {
        userContentScore = await this.findUserContentScoreUsingH5pId(
          roomId,
          studentId,
          contentId,
          subcontentId,
        )
      }

      if (!userContentScore) {
        throw new UserInputError(
          `Unknown UserContentScore(room_id(${roomId}), student_id(${studentId}), content_id(${contentId}))`,
        )
      }

      const teacherScore =
        (await this.assesmentDB.findOne(TeacherScore, {
          roomId: roomId,
          studentId: studentId,
          fullContentId: fullContentId,
          teacherId: teacherId,
        })) || TeacherScore.new(userContentScore, teacherId, score)

      teacherScore.score = score

      await this.assesmentDB.save(TeacherScore, teacherScore)

      return teacherScore
    } catch (e) {
      console.error(e)
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
    const userContentScore = await source.userContentScore
    const contentType = userContentScore?.contentType
    const contentName = userContentScore?.contentName
    return await getContent(
      source.fullContentId,
      contentType,
      contentName,
      this.contentRepository,
    )
  }

  private async findUserContentScoreUsingH5pId(
    roomId: string,
    studentId: string,
    h5pId: string,
    subContentId?: string,
  ) {
    const cmsContentId = await findCmsContentIdUsingH5pId(h5pId)
    if (!cmsContentId) {
      return undefined
    }

    const fullContentId = subContentId
      ? `${cmsContentId}|${subContentId}`
      : cmsContentId
    const userContentScore = await this.assesmentDB.findOne(UserContentScore, {
      roomId: roomId,
      studentId: studentId,
      contentId: fullContentId,
    })
    return userContentScore
  }
}
