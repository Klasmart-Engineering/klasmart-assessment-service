import { Mutation, Arg, Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { TeacherScore } from '../db/assessments/entities/teacherScore'
import { UserContentScore } from '../db/assessments/entities/userContentScore'
import { Content } from '../db/cms/entities/content'
import { User } from '../db/users/entities'
import { UserID } from './context'

@Service()
@Resolver(() => TeacherScore)
export default class TeacherScoreResolver {
  constructor(
    @InjectRepository(TeacherScore, 'assessments')
    private readonly repository: Repository<TeacherScore>,
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
    @InjectRepository(Content, 'cms')
    private readonly contentRepository: Repository<Content>,
  ) {}

  @Mutation((type) => TeacherScore)
  public async setScore(
    @Arg('room_id') room_id: string,
    @Arg('student_id') student_id: string,
    @Arg('content_id') content_id: string,
    @Arg('score') score: number,
    @UserID() teacher_id?: string,
  ) {
    try {
      if (!teacher_id) {
        return
      }
      const userContentScore = UserContentScore.new(
        room_id,
        student_id,
        content_id,
      )
      const teacherScore = TeacherScore.new(userContentScore, teacher_id, score)
      await this.repository.save(teacherScore)
      return teacherScore
    } catch (e) {
      console.error(e)
      throw new Error('Unable to save teacher score')
    }
  }

  @FieldResolver(() => User, { nullable: true })
  public async teacher(@Root() source: TeacherScore) {
    return await this.userRepository.findOne({
      where: { user_id: source.teacher_id },
    })
  }

  @FieldResolver(() => User, { nullable: true })
  public async student(@Root() source: TeacherScore) {
    return await this.userRepository.findOne({
      where: { user_id: source.student_id },
    })
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(@Root() source: TeacherScore) {
    return await this.contentRepository.findOne({
      where: { content_id: source.content_id },
    })
  }
}
