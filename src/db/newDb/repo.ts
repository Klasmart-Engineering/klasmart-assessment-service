import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Service } from 'typedi'
import { Comment } from './entities'

@Service()
export class NewRepo {
  constructor(
    @InjectRepository(Comment, 'new')
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async comment(id?: string): Promise<Comment | null> {
    return (
      (await this.commentRepository.findOne({
        where: { id },
      })) || null
    )
  }
}
