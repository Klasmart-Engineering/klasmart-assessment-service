import { UserInputError } from 'apollo-server-express'
import {
  Mutation,
  Arg,
  Resolver,
  FieldResolver,
  Root,
  Ctx,
  UseMiddleware,
} from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager, Repository } from 'typeorm'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'

import { TeacherScore, UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import { User } from '../db/users/entities'
import getContent from '../helpers/getContent'
import { ASSESSMENTS_CONNECTION_NAME } from '../db/assessments/connectToAssessmentDatabase'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'
import { Context, UserID } from '../auth/context'
import { mutationAuth } from '../auth/authChecker'

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

  @UseMiddleware(mutationAuth)
  @Mutation(() => TeacherScore)
  public async setScore(
    @Ctx() context: Context,
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('content_id') content_id: string,
    @Arg('score') score: number,
    @UserID() teacher_id: string,
  ): Promise<TeacherScore> {
    try {
      const userContentScore = await this.assesmentDB.findOne(
        UserContentScore,
        {
          room_id,
          student_id,
          content_id,
        },
      )

      if (!userContentScore) {
        throw new UserInputError(
          `Unknown UserContentScore(room_id(${room_id}), student_id(${student_id}), content_id(${content_id}))`,
        )
      }

      const teacherScore =
        (await this.assesmentDB.findOne(TeacherScore, {
          room_id: room_id,
          student_id: student_id,
          content_id: content_id,
          teacher_id: teacher_id,
        })) || TeacherScore.new(userContentScore, teacher_id, score)

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
      where: { user_id: source.teacher_id },
    })
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherScore,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { user_id: source.student_id },
    })
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(@Root() source: TeacherScore): Promise<Content | null> {
    const contentType = (await source.userContentScore)?.contentType
    return await getContent(
      source.content_id,
      contentType,
      this.contentRepository,
    )
  }
}
