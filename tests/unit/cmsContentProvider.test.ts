// import 'reflect-metadata'
// import { expect } from 'chai'
// import { Arg, Substitute } from '@fluffy-spoon/substitute'
// import { CmsContentProvider } from '../../src/providers/cmsContentProvider'
// import { CmsContentApi, ContentDto } from '../../src/web'
// import { Content } from '../../src/db/cms/entities'
// import { delay } from '../../src/helpers/delay'
// import { ICache, InMemoryCache } from '../../src/cache'

// describe('cmsContentProvider', () => {
//   let intervalId: NodeJS.Timeout | undefined

//   afterEach(() => {
//     if (intervalId) {
//       clearInterval(intervalId)
//     }
//   })

//   describe('getLessonMaterials', () => {
//     context(
//       '1 lesson material exists matching provided roomId; student_content_map is undefined',
//       () => {
//         it('returns 1 matching lesson material; cache miss', async () => {
//           // Arrange
//           const roomId = 'room1'
//           const studentId = 'student1'
//           const cmsContentApi = Substitute.for<CmsContentApi>()
//           cmsContentApi.getLessonMaterials(roomId, Arg.any()).resolves({
//             list: [contentDto1],
//             student_content_map: undefined,
//             total: 1,
//           })
//           const cache = Substitute.for<ICache>()
//           const sut = new CmsContentProvider(cmsContentApi, cache)
//           intervalId = sut.cache.setRecurringFlush(100)

//           // Act
//           const { contents, studentContentMap } = await sut.getLessonMaterials(
//             roomId,
//           )

//           // Assert
//           expect(studentContentMap).to.have.lengthOf(0)
//           expect(contents).to.have.lengthOf(1)
//           expect(contents.get(content1.contentId)).to.deep.equal({
//             content: content1,
//             subContents: [],
//           })
//           cmsContentApi.received(1).getLessonMaterials(Arg.all())
//           // TODO: Update when caching is reinstated.
//           // cache
//           //   .received(1)
//           //   .setLessonPlanMaterials(
//           //     Arg.is(
//           //       (x) => x.length === 1 && x[0].contentId === contentDto1.id,
//           //     ),
//           //   )
//         })
//       },
//     )

//     context(
//       '1 lesson material exists matching provided roomId; student_content_map contains 1 student',
//       () => {
//         it('returns 1 matching lesson material; cache miss', async () => {
//           // Arrange
//           const roomId = 'room1'
//           const studentId = 'student1'
//           const cmsContentApi = Substitute.for<CmsContentApi>()
//           cmsContentApi.getLessonMaterials(roomId, Arg.any()).resolves({
//             list: [contentDto1],
//             student_content_map: [
//               { student_id: studentId, content_ids: [contentDto1.id ?? ''] },
//             ],
//             total: 1,
//           })
//           const cache = Substitute.for<ICache>()
//           const sut = new CmsContentProvider(cmsContentApi, cache)
//           intervalId = sut.cache.setRecurringFlush(100)

//           // Act
//           const { contents, studentContentMap } = await sut.getLessonMaterials(
//             roomId,
//           )

//           // Assert
//           expect(studentContentMap).to.have.lengthOf(1)
//           expect(studentContentMap[0].studentId).to.equal(studentId)
//           expect(contents).to.have.lengthOf(1)
//           expect(contents.get(content1.contentId)).to.deep.equal({
//             content: content1,
//             subContents: [],
//           })
//           cmsContentApi.received(1).getLessonMaterials(Arg.all())
//           // TODO: Update when caching is reinstated.
//           // cache
//           //   .received(1)
//           //   .setLessonPlanMaterials(
//           //     Arg.is(
//           //       (x) => x.length === 1 && x[0].contentId === contentDto1.id,
//           //     ),
//           //   )
//         })
//       },
//     )
//   })

//   describe('getLessonMaterial', () => {
//     context('1 matching lesson material exists; first time access', () => {
//       it('returns matching lesson material; cache miss', async () => {
//         // Arrange
//         const lessonMaterialId = content1.contentId
//         const cmsContentApi = Substitute.for<CmsContentApi>()
//         cmsContentApi
//           .getLessonMaterial(lessonMaterialId, Arg.any())
//           .resolves(contentDto1)
//         const cache = new InMemoryCache()
//         const sut = new CmsContentProvider(cmsContentApi, cache)
//         intervalId = sut.cache.setRecurringFlush(100)

//         // Act
//         const result = await sut.getLessonMaterial(lessonMaterialId)

//         // Assert
//         expect(result).to.deep.equal(content1)
//         cmsContentApi.received(1).getLessonMaterial(Arg.all())
//       })
//     })

//     context(
//       '1 matching lesson material exists; second access; within cache duration',
//       () => {
//         it('returns matching lesson material; cache hit', async () => {
//           // Arrange
//           const lessonMaterialId = content1.contentId
//           const cmsContentApi = Substitute.for<CmsContentApi>()
//           cmsContentApi
//             .getLessonMaterial(lessonMaterialId, Arg.any())
//             .resolves(contentDto1)
//           const cache = new InMemoryCache()
//           const sut = new CmsContentProvider(cmsContentApi, cache)
//           intervalId = sut.cache.setRecurringFlush(100)

//           // Act
//           const result1 = await sut.getLessonMaterial(lessonMaterialId)
//           cmsContentApi.clearSubstitute()
//           cmsContentApi
//             .getLessonMaterial(lessonMaterialId)
//             .resolves(contentDto1)
//           const result2 = await sut.getLessonMaterial(lessonMaterialId)

//           // Assert
//           expect(result2).to.deep.equal(content1)
//           cmsContentApi.didNotReceive().getLessonMaterial(Arg.any())
//         })
//       },
//     )

//     context(
//       '1 matching lesson material exists; second access; outside of cache duration',
//       () => {
//         it('returns matching lesson material; cache miss', async () => {
//           // Arrange
//           const lessonMaterialId = content1.contentId
//           const authenticationToken = undefined
//           const cmsContentApi = Substitute.for<CmsContentApi>()
//           cmsContentApi
//             .getLessonMaterial(lessonMaterialId, authenticationToken)
//             .resolves(contentDto1)
//           const cache = new InMemoryCache()
//           const sut = new CmsContentProvider(cmsContentApi, cache)
//           intervalId = sut.cache.setRecurringFlush(100)

//           // Act
//           const result1 = await sut.getLessonMaterial(lessonMaterialId)
//           cmsContentApi.clearSubstitute()
//           cmsContentApi
//             .getLessonMaterial(lessonMaterialId, authenticationToken)
//             .resolves(contentDto1)
//           await delay(100)
//           const result2 = await sut.getLessonMaterial(lessonMaterialId)

//           // Assert
//           expect(result2).to.deep.equal(content1)
//           cmsContentApi.received(1).getLessonMaterial(Arg.all())
//         })
//       },
//     )

//     // TODO: Update when caching is reinstated.
//     context.skip(
//       '1 matching lesson material exists; called right after fetching by roomId; within cache duration',
//       () => {
//         it('returns matching lesson material; cache hit', async () => {
//           // Arrange
//           const roomId = 'room1'
//           const studentId = 'student'
//           const lessonMaterialId = content1.contentId
//           const cmsContentApi = Substitute.for<CmsContentApi>()
//           cmsContentApi.getLessonMaterials(roomId, Arg.any()).resolves({
//             list: [contentDto1],
//             student_content_map: undefined,
//             total: 1,
//           })
//           cmsContentApi
//             .getLessonMaterial(lessonMaterialId)
//             .resolves(contentDto1)
//           const cache = new InMemoryCache()
//           const sut = new CmsContentProvider(cmsContentApi, cache)
//           intervalId = sut.cache.setRecurringFlush(200)

//           // Act
//           const lessonMaterialsForLessonPlan = await sut.getLessonMaterials(
//             roomId,
//           )
//           const lessonMaterial = await sut.getLessonMaterial(lessonMaterialId)

//           // Assert
//           expect(lessonMaterial).to.deep.equal(content1)
//           cmsContentApi.didNotReceive().getLessonMaterial(Arg.any())
//         })
//       },
//     )
//   })

//   describe('getLessonMaterialsWithSourceId', () => {
//     context('1 lesson material exists matching provided sourceId', () => {
//       it('returns 1 matching lesson material', async () => {
//         // Arrange
//         const sourceId = 'source1'
//         const cmsContentApi = Substitute.for<CmsContentApi>()
//         cmsContentApi
//           .getLessonMaterialsWithSourceId(sourceId, Arg.any())
//           .resolves([contentDto1])
//         const cache = new InMemoryCache()
//         const sut = new CmsContentProvider(cmsContentApi, cache)

//         // Act
//         const results = await sut.getLessonMaterialsWithSourceId(sourceId)

//         // Assert
//         expect(results).to.have.lengthOf(1)
//         expect(results[0]).to.deep.equal(content1)
//       })
//     })
//   })
// })

// const contentDto1: ContentDto = {
//   id: '6099c28a1f42c08c3e3d447e',
//   content_name: 'LM',
//   data: '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
//   publish_status: 'published',
// }

// const content1 = new Content(
//   '6099c28a1f42c08c3e3d447e',
//   'LM',
//   'published',
//   JSON.parse(
//     '{"source": "6099c2832069df0014dc34cb", "file_type": 5, "input_source": 1}',
//   ),
// )
