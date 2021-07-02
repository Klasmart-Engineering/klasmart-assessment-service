import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { Content } from '../db/cms/entities'
import getContent from '../helpers/getContent'
import { ContentScores } from '../graphql/scoresByContent'

@Service()
@Resolver(() => ContentScores)
export default class ContentScoresResolver {
  constructor(
    @InjectRepository(Content, CMS_CONNECTION_NAME)
    private readonly contentRepository: Repository<Content>,
  ) {}

  @FieldResolver(() => Content, { nullable: true })
  public async content(@Root() source: ContentScores): Promise<Content | null> {
    return await getContent(
      source.contentKey,
      source.contentType,
      source.contentName,
      this.contentRepository,
    )
  }
}
