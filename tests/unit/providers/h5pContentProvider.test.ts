import 'reflect-metadata'
import { expect } from 'chai'
import { Arg, Substitute } from '@fluffy-spoon/substitute'
import { H5pContentProvider } from '../../../src/providers/h5pContentProvider'
import { H5PInfoResponse } from '../../../src/web/h5p'
import H5pContent from '../../../src/helpers/h5pContent'
import { CachedH5pContentApi } from '../../../src/web/h5p/cachedH5pContentApi'

describe('h5pContentProvider', () => {
  describe('getH5pContents', () => {
    context(
      'h5pContentApi returns an array of 1 content with 1 subcontent which also contains 1 subcontent.',
      () => {
        it('returns a map containing 1 H5PContent with 2 subcontents', async () => {
          // Arrange
          const h5pIds = ['60a715b0b4e91700136c585b']
          const h5pContentApi = Substitute.for<CachedH5pContentApi>()
          h5pContentApi.getH5pContents(h5pIds, Arg.any()).resolves(response)
          const sut = new H5pContentProvider(h5pContentApi)

          // Act
          const result = await sut.getH5pContents(h5pIds, undefined)

          // Assert
          expect(result == null).to.be.false
          expect(result).to.have.lengthOf(1)

          const value = result.get('60a715b0b4e91700136c585b')
          const expectedValue: H5pContent = {
            id: '60a715b0b4e91700136c585b',
            type: 'InteractiveBook',
            subContents: [
              {
                id: '44cc1c37-8dac-4a5c-951e-50a8447ba4a4',
                type: 'Column',
                name: 'test ib ib',
                parentId: '60a715b0b4e91700136c585b',
              },
              {
                id: '3b3502e9-08ed-498a-82a0-5b3eee6612c4',
                type: 'TrueFalse',
                name: 'Untitled True/False Question',
                parentId: '44cc1c37-8dac-4a5c-951e-50a8447ba4a4',
              },
            ],
          }
          expect(value).to.deep.equal(expectedValue)
        })
      },
    )
  })
})

const contentsJson = `[
  {
    "id": "60a715b0b4e91700136c585b",
    "type": "InteractiveBook",
    "name": "test ib",
    "subContents": [
      {
        "id": "44cc1c37-8dac-4a5c-951e-50a8447ba4a4",
        "type": "Column",
        "name": "test ib ib",
        "subContents": [
          {
              "id": "3b3502e9-08ed-498a-82a0-5b3eee6612c4",
              "type": "TrueFalse",
              "name": "Untitled True/False Question"
          }
        ]
      }
    ]
  }
]`

const response: H5PInfoResponse = {
  contents: JSON.parse(contentsJson),
}
