import 'reflect-metadata'
import { expect } from 'chai'
import ContentResolver from '../../src/resolvers/content'
import { LessonMaterialBuilder } from '../builders'

describe('contentResolver', () => {
  describe('fileType', () => {
    context('content.fileType is undefined', () => {
      it('', async () => {
        const content = new LessonMaterialBuilder().withUndefinedData().build()

        const sut = new ContentResolver()

        // Act
        const result = sut.fileType(content)

        // Assert
        expect(result).to.be.undefined
      })
    })
  })

  describe('type', () => {
    context('content.type and content.fileType are undefined', () => {
      it('', async () => {
        const content = new LessonMaterialBuilder().withUndefinedData().build()

        const sut = new ContentResolver()

        // Act
        const result = sut.type(content)

        // Assert
        expect(result).to.be.undefined
      })
    })
  })
})
