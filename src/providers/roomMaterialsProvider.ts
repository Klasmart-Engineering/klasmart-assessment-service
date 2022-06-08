import { Service } from 'typedi'
import { Content } from '../db/cms/entities'
import { notNullish } from '../helpers/filters'
import { H5pSubContent } from '../helpers/h5pContent'

import {
  CmsContentProvider,
  StudentContentMapEntry,
  StudentContentsResult,
} from '../providers/cmsContentProvider'
import { CmsScheduleProvider } from '../providers/cmsScheduleProvider'
import { H5pContentProvider } from './h5pContentProvider'

@Service()
export class RoomMaterialsProvider {
  public constructor(
    private readonly cmsScheduleProvider: CmsScheduleProvider,
    private readonly cmsContentProvider: CmsContentProvider,
    private readonly h5pContentProvider: H5pContentProvider,
  ) {}

  /**
   * Combines CMS content information with H5P-specific information to formulate
   * a single master list. Also includes a roster of students mapped to their contents.
   */
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
    await this.addH5pSubContents(studentContentsResult, authenticationToken)

    return studentContentsResult
  }

  private async addH5pSubContents(
    studentContentsResult: StudentContentsResult,
    authenticationToken: string | undefined,
  ) {
    const h5pIds = [...studentContentsResult.contents.values()]
      .map((x) => x.content.h5pId)
      .filter(notNullish)
    const h5pIdToH5pContentMap = await this.h5pContentProvider.getH5pContents(
      h5pIds,
      authenticationToken,
    )

    for (const content of studentContentsResult.contents.values()) {
      if (!content.content.h5pId) {
        continue
      }
      const h5p = h5pIdToH5pContentMap.get(content.content.h5pId)
      if (!h5p) {
        continue
      }
      content.content.type = h5p.type
      content.subContents = h5p.subContents.map((x) =>
        this.createContent(content.content, x),
      )
    }
  }

  private createContent(baseline: Content, subContent: H5pSubContent) {
    const content = new Content(
      baseline.contentId,
      baseline.author,
      baseline.name,
      baseline.contentType,
      baseline.createdAt,
      baseline.data,
      baseline.publishStatus,
    )
    content.type = subContent.type
    content.subcontentId = subContent.id
    //content.name = subContent.name
    content.parentId = subContent.parentId
    return content
  }
}
