import { expect } from 'chai'
import { Substitute } from '@fluffy-spoon/substitute'
import { RoomMaterialsProvider } from '../../src/providers/roomMaterialsProvider'
import { LessonMaterialBuilder } from '../builders'
import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
import { CmsScheduleProvider } from '../../src/providers/cmsScheduleProvider'

describe('roomMaterialsProvider', () => {
  context('1 LessonPlan with 1 Material, 1 matching Schedule', () => {
    it('returns 1 Material', async () => {
      // Arrange
      const roomId = 'room1'
      const studentId = 'student'
      const authenticationToken = undefined

      const material = new LessonMaterialBuilder().build()
      const cmsContentProvider = Substitute.for<CmsContentProvider>()
      const cmsScheduleProvider = Substitute.for<CmsScheduleProvider>()

      cmsContentProvider
        .getLessonMaterials(roomId, authenticationToken)
        .resolves({
          contents: new Map([[material.contentId, material]]),
          studentContentMap: [{ studentId, contentIds: [material.contentId] }],
        })

      const sut = new RoomMaterialsProvider(
        cmsScheduleProvider,
        cmsContentProvider,
      )

      // Act
      const { contents, studentContentMap } = await sut.getMaterials(roomId)

      // Assert
      expect(studentContentMap).to.have.lengthOf(1)
      expect(studentContentMap[0].studentId).to.equal(studentId)
      expect(contents).to.have.lengthOf(1)
      expect(contents.get(material.contentId)).to.deep.equal(material)
    })
  })
})
