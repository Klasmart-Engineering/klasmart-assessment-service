import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { Service } from 'typedi'
import { TeacherComment } from './entities/teacherComments'
import { ASSESSMENTS_CONNECTION_NAME } from './connectToAssessmentDatabase'

@Service()
export class AssessmentRepo {
  constructor(
    @InjectRepository(TeacherComment, ASSESSMENTS_CONNECTION_NAME)
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
