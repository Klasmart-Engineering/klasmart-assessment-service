import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { RoomMaterialsProvider } from '../../src/providers/roomMaterialsProvider'
import { LessonMaterialBuilder } from '../builders'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
import { CmsScheduleProvider } from '../../src/providers/cmsScheduleProvider'
import { H5pContentProvider } from '../../src/providers/h5pContentProvider'
import { FileType } from '../../src/db/cms/enums'

describe('roomMaterialsProvider', () => {
  context('1 h5p lesson material, 1 matching schedule, 1 student', () => {
    it('returns result with 1 material and 1 student', async () => {
      // Arrange
      const roomId = 'room1'
      const studentId = 'student'
      const h5pId = 'h5p1'
      const h5pType = 'Flashcards'
      const authenticationToken = undefined

      const material = new LessonMaterialBuilder()
        .withSource(FileType.H5P, h5pId)
        .build()
      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()
      const h5pContentProvider = Substitute.for<H5pContentProvider>()

      cmsContentProvider
        .getLessonMaterials(roomId, authenticationToken)
        .resolves({
          contents: new Map([
            [material.contentId, { content: material, subContents: [] }],
          ]),
          studentContentMap: [{ studentId, contentIds: [material.contentId] }],
        })
      h5pContentProvider
        .getH5pContents(Arg.any(), authenticationToken)
        .resolves(
          new Map([[h5pId, { id: h5pId, type: h5pType, subContents: [] }]]),
        )

      const sut = new RoomMaterialsProvider(
        cmsScheduleProvider,
        cmsContentProvider,
        h5pContentProvider,
      )

      // Act
      const { contents, studentContentMap } = await sut.getMaterials(roomId)

      // Assert
      expect(studentContentMap).to.have.lengthOf(1)
      expect(studentContentMap[0].studentId).to.equal(studentId)
      expect(contents).to.have.lengthOf(1)
      expect(contents.get(material.contentId)).to.deep.equal({
        content: material,
        subContents: [],
      })
    })
  })
})
