import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Service } from 'typedi'
import { TeacherComment } from './entities/teacherComments'

@Service()
export class AssessmentRepo {
  constructor(
    @InjectRepository(TeacherComment, 'assessments')
    private readonly commentRepository: Repository<TeacherComment>,
  ) {}

  async comment(id?: string): Promise<TeacherComment | null> {
    return (
      (await this.commentRepository.findOne({
        where: { id },
      })) || null
    )
  }
}
