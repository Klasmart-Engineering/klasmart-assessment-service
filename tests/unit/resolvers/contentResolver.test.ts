import 'reflect-metadata'
import { expect } from 'chai'
import { LessonMaterialBuilder } from '../../builders'

describe('contentResolver', () => {
  describe('fileType', () => {
    context('content.fileType is undefined', () => {
      it('', async () => {
        const sut = new LessonMaterialBuilder().withUndefinedData().build()

        // Act
        const result = sut.fileType

        // Assert
        expect(result).to.be.undefined
      })
    })
  })

  describe('type', () => {
    context('content.type and content.fileType are undefined', () => {
      it('', async () => {
        const sut = new LessonMaterialBuilder().withUndefinedData().build()

        // Act
        const result = sut.type

        // Assert
        expect(result).to.be.undefined
      })
    })
  })
})
