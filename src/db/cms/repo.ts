import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Service } from 'typedi'
import { CmsContent } from './entities'

@Service()
export class CmsRepo {
  constructor(
    @InjectRepository(CmsContent, 'cms')
    private readonly cmsContentRepository: Repository<CmsContent>,
  ) {}

  async lessonMaterial(id?: string): Promise<CmsContent | null> {
    return (
      (await this.cmsContentRepository.findOne({
        where: { id },
      })) || null
    )
  }

  async lessonMaterialWithContentId(
    contentId: string,
  ): Promise<CmsContent | null> {
    return (
      (await this.cmsContentRepository
        .createQueryBuilder()
        .where({ contentType: 1 })
        .andWhere(`data->"$.source" = :contentId`, { contentId })
        .getOne()) || null
    )
  }
}
