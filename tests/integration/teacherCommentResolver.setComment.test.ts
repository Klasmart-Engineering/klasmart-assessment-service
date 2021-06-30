import { expect } from 'chai'
import {
  EndUserBuilder,
  LessonMaterialBuilder,
  RoomBuilder,
  UserBuilder,
  UserContentScoreBuilder,
} from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { setTeacherCommentMutation } from '../queriesAndMutations/teacherCommentOps'
import { User } from '../../src/db/users/entities'
import EndUser from '../entities/endUser'
import {
  GqlTeacherComment,
  GqlUser,
} from '../queriesAndMutations/gqlInterfaces'
import { FindConditions } from 'typeorm'

describe('teacherCommentResolver.setComment', () => {
  const roomId = 'room1'
  let endUser: EndUser
  let gqlTeacherComment: GqlTeacherComment | undefined | null
  let student: User
  const comment = 'great job!'

  context('1 student, 1 xapi event', () => {
    before(async () => {
      // Arrange
      await dbConnect()
      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const lessonMaterial = await new LessonMaterialBuilder().buildAndPersist()
      await new RoomBuilder().withRoomId(roomId).buildAndPersist()
      const userContentScore = await new UserContentScoreBuilder()
        .withroomId(roomId)
        .withStudentId(student.userId)
        .withContentId(lessonMaterial.contentId)
        .buildAndPersist()
    })

    after(async () => await dbDisconnect())

    it('executes without throwing an error', async () => {
      // Act
      gqlTeacherComment = await setTeacherCommentMutation(
        roomId,
        student.userId,
        comment,
        endUser,
      )
      //console.log(JSON.stringify(gqlRoom, null, 2))
    })

    it('returns non-null teacherComment', () => {
      expect(gqlTeacherComment).to.not.be.null
    })

    // it('returns teacherComment with expected created date', () => {
    //   expect(gqlTeacherComment?.date).is.equal(Date.now())
    // })

    // it('returns teacherComment with expected updated date', () => {
    //   expect(gqlTeacherComment?.lastUpdated).is.equal(Date.now())
    // })

    it('returns teacherComment with expected comment', () => {
      expect(gqlTeacherComment?.comment).is.equal(comment)
    })

    it('returns teacherComment with expected teacher', async () => {
      const expectedTeacher: FindConditions<GqlUser> = {
        user_id: endUser.userId,
        given_name: endUser.givenName,
        family_name: endUser.familyName,
      }
      expect(gqlTeacherComment?.teacher).to.deep.equal(expectedTeacher)
    })

    it('returns teacherComment with expected student', async () => {
      const expectedStudent: FindConditions<GqlUser> = {
        user_id: student.userId,
        given_name: student.givenName,
        family_name: student.familyName,
      }
      expect(gqlTeacherComment?.student).to.deep.equal(expectedStudent)
    })
  })
})
