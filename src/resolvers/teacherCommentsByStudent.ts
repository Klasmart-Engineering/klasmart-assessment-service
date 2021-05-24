import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { User } from '../db/users/entities'
import { TeacherCommentsByStudent } from '../graphql/teacherCommentsByUser'

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  constructor(
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async student(@Root() source: TeacherCommentsByStudent) {
    return await this.userRepository.findOne({
      where: { user_id: source.student_id },
    })
  }
}
