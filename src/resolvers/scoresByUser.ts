import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { User } from '../db/users/entities'
import { UserScores } from '../graphql/scoresByUser'

@Service()
@Resolver(() => UserScores)
export default class UserScoresResolver {
  constructor(
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(@Root() source: UserScores) {
    return await this.userRepository.findOne({
      where: { user_id: source.user_id },
    })
  }
}
