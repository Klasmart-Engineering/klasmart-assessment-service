import { Mutation, Arg, Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { EntityManager, Repository } from 'typeorm'
import { InjectManager, InjectRepository } from 'typeorm-typedi-extensions'
import { TeacherScore } from '../db/assessments/entities/teacherScore'
import { UserContentScore } from '../db/assessments/entities/userContentScore'
import { Content } from '../db/cms/entities/content'
import { User } from '../db/users/entities'
import { UserID } from './context'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  constructor(
    @InjectManager('assessments')
    private readonly assesmentDB: EntityManager,
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
    @InjectRepository(Content, 'cms')
    private readonly contentRepository: Repository<Content>,
  ) {}

  @Mutation(() => TeacherScore)
  public async setScore(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('content_id') content_id: string,
    @Arg('score') score: number,
    @UserID() teacher_id?: string,
  ): Promise<TeacherScore> {
    try {
      if (!teacher_id) {
        throw new Error('Please authenticate')
      }

      const userContentScore = await this.assesmentDB.findOne(
        UserContentScore,
        {
          room_id,
          student_id,
          content_id,
        },
      )

      if (!userContentScore) {
        throw new Error(
          `Unknown UserContentScore(room_id(${room_id}), student_id(${student_id}), content_id(${content_id}))`,
        )
      }

      let teacherScore = await this.assesmentDB.findOne(TeacherScore, {
        room_id: room_id,
        student_id: student_id,
        content_id: content_id,
        teacher_id: teacher_id,
      })

      let update = true
      if (!teacherScore) {
        update = false
        teacherScore = TeacherScore.new(userContentScore, teacher_id, score)
      }

      //TODO: Investigate upsert
      if (update) {
        await this.assesmentDB.save(TeacherScore, teacherScore)
      } else {
        await this.assesmentDB.insert(TeacherScore, teacherScore)
      }

      return teacherScore
    } catch (e) {
      console.error(e)
      throw e
    }
    throw new Error('Unable to save teacher score')
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
    return (
      (await this.contentRepository
        .createQueryBuilder()
        .where({ content_type: 1 })
        .andWhere(`data->"$.source" = :contentId`, {
          contentId: source.content_id,
        })
        .getOne()) || null
    )
  }
}
