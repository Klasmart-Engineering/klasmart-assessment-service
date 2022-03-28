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
    const studentContentsResult =
      await this.cmsContentProvider.getLessonMaterials(
        roomId,
        authenticationToken,
      )
    if (studentContentsResult.studentContentMap.length === 0) {
      // studentContentMap is empty, which means this is not an
      // "adaptive review class". So all students in this class
      // studied the same list of lesson materials. Now we fetch
      // the student roster and assign the lesson materials.
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
