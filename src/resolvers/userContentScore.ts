import { FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Repository } from 'typeorm'

import { User } from '../db/users/entities'
import { UserContentScore } from '../db/assessments/entities'
import { Content } from '../db/cms/entities'
import getContent from '../getContent'

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  constructor(
    @InjectRepository(User, 'users')
    private readonly userRepository: Repository<User>,
    @InjectRepository(Content, 'cms')
    private readonly contentRepository: Repository<Content>,
  ) {}

  @FieldResolver(() => User, { nullable: true })
  public async user(
    @Root() source: UserContentScore,
  ): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { user_id: source.student_id },
    })
  }

  @FieldResolver(() => Content, { nullable: true })
  public async content(
    @Root() source: UserContentScore,
  ): Promise<Content | null> {
    return await getContent(
      source.content_id,
      source.contentType,
      this.contentRepository,
    )
  }
}
