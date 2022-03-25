import { UserInputError } from 'apollo-server-express'
import { Service } from 'typedi'
import { ErrorMessage } from '../helpers/errorMessages'

import {
  CmsContentProvider,
  StudentContentMapEntry,
  StudentContentsResult,
} from '../providers/cmsContentProvider'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'

@Service()
export class RoomMaterialsProvider {
  public constructor(
    private readonly cmsScheduleProvider: CmsScheduleProvider,
    private readonly cmsContentProvider: CmsContentProvider,
  ) {}

  public async getMaterials(
    roomId: string,
    authenticationToken?: string,
  ): Promise<StudentContentsResult> {
    const schedule = await this.cmsScheduleProvider.getSchedule(
      roomId,
      authenticationToken,
    )
    if (!schedule) {
      throw new UserInputError(ErrorMessage.scheduleNotFound(roomId))
    }
    const studentContentsResult =
      await this.cmsContentProvider.getLessonMaterials(
        roomId,
        authenticationToken,
      )
    if (studentContentsResult.studentContentMap.length === 0) {
      const studentIds = await this.cmsScheduleProvider.getStudentIds(
        roomId,
        authenticationToken,
      )
      const newStudentContentMap: StudentContentMapEntry[] = []
      const contentIds = [...studentContentsResult.contents.keys()]
      for (const studentId of studentIds) {
        newStudentContentMap.push({ studentId, contentIds })
      }
      studentContentsResult.studentContentMap = newStudentContentMap
    }
    return studentContentsResult
  }
}
