import { FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'

import { User } from '../db/users/entities'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import getContent from '../helpers/getContent'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { USERS_CONNECTION_NAME } from '../db/users/connectToUserDatabase'

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  constructor(
    @InjectRepository(User, USERS_CONNECTION_NAME)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Content, CMS_CONNECTION_NAME)
    private readonly contentRepository: Repository<Content>,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserContentScore,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { userId: source.studentId },
    })
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: UserContentScore,
  ): Promise<Content | null> {
    return await getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      this.contentRepository,
    )
  }
}
