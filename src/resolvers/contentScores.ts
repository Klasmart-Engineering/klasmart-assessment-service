import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Content } from '../db/cms/entities/content'
import { ContentScores } from '../graphql/scoresByContent'

@Service()
@Resolver(() => ContentScores)
export default class ContentScoresResolver {
  constructor(
    @InjectRepository(Content, 'cms')
    private readonly contentRepository: Repository<Content>,
  ) {}

  @FieldResolver(() => Content, { nullable: true })
  public async content(@Root() source: ContentScores) {
    return await this.contentRepository.findOne({
      where: { content_id: source.content_id },
    })
  }
}
