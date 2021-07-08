import { UserInputError } from 'apollo-server-express'
import { Service } from 'typedi'
import { Repository } from 'typeorm'
import { InjectRepository } from 'typeorm-typedi-extensions'
import { CMS_CONNECTION_NAME } from '../db/cms/connectToCmsDatabase'
import { Content, Schedule } from '../db/cms/entities'
import { LessonPlan } from '../db/cms/entities/lessonPlan'
import { ErrorMessage } from './errorMessages'
import { ILogger, Logger } from './logger'

@Service()
export class RoomMaterialsProvider {
  private static _logger: ILogger
  private get Logger(): ILogger {
    return (
      RoomMaterialsProvider._logger ||
      (RoomMaterialsProvider._logger = Logger.get('RoomMaterialsProvider'))
    )
  }

  public constructor(
    @InjectRepository(Schedule, CMS_CONNECTION_NAME)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Content, CMS_CONNECTION_NAME)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(LessonPlan, CMS_CONNECTION_NAME)
    private readonly lessonPlanRepository: Repository<LessonPlan>,
  ) {}

  public async getMaterials(roomId: string): Promise<Content[]> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: roomId },
    })
    if (!schedule) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
    }
    const lessonPlanId = schedule.lessonPlanId
    const lessonPlan = await this.lessonPlanRepository.findOne({
      where: { contentId: lessonPlanId },
    })
    if (!lessonPlan) {
      this.Logger.warn(
        `lesson plan (${lessonPlanId}) not found. Returning an empty material list`,
      )
      return []
    }
    const materialIds = lessonPlan.materialIds
    const initial: { [key: string]: number } = {}
    const materialIdToIndexMap = materialIds.reduce((map, id, index) => {
      map[id] = index
      return map
    }, initial)
    const materials = await this.contentRepository
      .createQueryBuilder('content')
      .where('content.id IN (:...materialIds)', { materialIds })
      .getMany()
    return materials.sort(
      (a, b) =>
        materialIdToIndexMap[a.contentId] - materialIdToIndexMap[b.contentId],
    )
  }
}
