import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'
import { User } from '../db/users/entities'
import { TeacherCommentsByStudent } from '../graphql'

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  constructor(
    @InjectRepository(User, USERS_CONNECTION_NAME)
    private readonly userRepository: Repository<User>,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherCommentsByStudent,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { userId: source.studentId },
    })
  }
}
