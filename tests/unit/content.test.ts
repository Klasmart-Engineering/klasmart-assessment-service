import { expect } from 'chai'
import { FileType } from '../../src/db/cms/enums'
import { LessonMaterialBuilder } from '../builders'

describe('content.populateH5pId', () => {
  context('fileType is FileType.H5P', () => {
    it('h5pId has expected value', () => {
      const builder = new LessonMaterialBuilder().withSource(FileType.H5P)
      const material = builder.build()
      material.h5pId = undefined
      material['populateH5pId']()
      expect(material.h5pId).to.equal(builder['rawSourceId'])
    })
  })

  context('data is undefined', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonMaterialBuilder()
        .withUndefinedData()
        .withUndefinedH5pId()
      const material = builder.build()
      material['populateH5pId']()
      expect(material.h5pId).to.be.undefined
    })
  })

  context('fileType is FileType.Audio', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonMaterialBuilder().withSource(FileType.Audio)
      const material = builder.build()
      material['populateH5pId']()
      expect(material.h5pId).to.be.undefined
    })
  })

  context('fileType is FileType.Document', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonMaterialBuilder().withSource(FileType.Document)
      const material = builder.build()
      material['populateH5pId']()
      expect(material.h5pId).to.be.undefined
    })
  })

  context('fileType is FileType.Image', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonMaterialBuilder().withSource(FileType.Image)
      const material = builder.build()
      material['populateH5pId']()
      expect(material.h5pId).to.be.undefined
    })
  })

  context('fileType is FileType.Video', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonMaterialBuilder().withSource(FileType.Video)
      const material = builder.build()
      material['populateH5pId']()
      expect(material.h5pId).to.be.undefined
    })
  })

  context('fileType is FileType.H5PExtension', () => {
    it('h5pId is undefined', () => {
      const builder = new LessonMaterialBuilder().withSource(
        FileType.H5PExtension,
      )
      const material = builder.build()
      material['populateH5pId']()
      expect(material.h5pId).to.be.undefined
    })
  })
})
