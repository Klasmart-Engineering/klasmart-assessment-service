import { expect } from 'chai'
import {
  EndUserBuilder,
  RoomBuilder,
  ScheduleBuilder,
  TeacherCommentBuilder,
  UserBuilder,
} from '../builders'
import { dbConnect, dbDisconnect } from '../utils/globalIntegrationTestHooks'
import { setTeacherCommentMutation } from '../queriesAndMutations/teacherCommentOps'
import { User } from '../../src/db/users/entities'
import EndUser from '../entities/endUser'
import {
  GqlTeacherComment,
  GqlUser,
} from '../queriesAndMutations/gqlInterfaces'
import { FindConditions, getRepository } from 'typeorm'
import { ErrorMessage } from '../../src/helpers/errorMessages'
import { TestTitle } from '../utils/testTitles'
import { v4 } from 'uuid'
import { TeacherComment } from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

/**
 * - throws when not authenticated
 * - throws when student doesn't exist
 * - throws when schedule doesn't exist for room
 * - add new comment
 * - update existing comment
 * - existing comment for same room/teacher but different student
 * - existing comment for same teacher/student but different room
 */

describe('teacherCommentResolver.setComment', () => {
  const teacherCommentRepo = () =>
    getRepository(TeacherComment, ASSESSMENTS_CONNECTION_NAME)

  context(TestTitle.Authentication.context, () => {
    it(TestTitle.Authentication.throwsError, async () => {
      // Arrange
      await dbConnect()
      const roomId = 'room1'
      const comment = 'great job!'
      const student = await new UserBuilder().buildAndPersist()
      const endUser = await new EndUserBuilder()
        .dontAuthenticate()
        .buildAndPersist()

      // Act
      const fn = () =>
        setTeacherCommentMutation(
          roomId,
          student.userId,
          comment,
          endUser,
          false,
        )

      // Assert
      await expect(fn()).to.be.rejectedWith(ErrorMessage.notAuthenticated)
    })

    after(async () => await dbDisconnect())
  })

  context('no student with the provided id exists', () => {
    it('throws unknown User error', async () => {
      // Arrange
      await dbConnect()
      const comment = 'great job!'
      const room = await new RoomBuilder().buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(room.roomId)
        .buildAndPersist()
      const providedStudentId = v4()
      const endUser = await new EndUserBuilder()
        .authenticate()
        .buildAndPersist()

      // Act
      const fn = () =>
        setTeacherCommentMutation(
          room.roomId,
          providedStudentId,
          comment,
          endUser,
          false,
        )

      // Assert
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.unknownUser(providedStudentId),
      )
    })

    after(async () => await dbDisconnect())
  })

  context(TestTitle.ScheduleNotFound.context, () => {
    it(TestTitle.ScheduleNotFound.throwsError, async () => {
      // Arrange
      await dbConnect()
      const comment = 'great job!'
      const room = await new RoomBuilder().buildAndPersist()
      const student = await new UserBuilder().buildAndPersist()
      const endUser = await new EndUserBuilder()
        .authenticate()
        .buildAndPersist()

      // Act
      const fn = () =>
        setTeacherCommentMutation(
          room.roomId,
          student.userId,
          comment,
          endUser,
          false,
        )

      // Assert
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.scheduleNotFound(room.roomId),
      )
    })

    after(async () => await dbDisconnect())
  })

  context('no existing comment', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlTeacherComment: GqlTeacherComment | undefined | null
    let student: User
    const commentText = 'great job!'

    before(async () => {
      // Arrange
      await dbConnect()
      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const room = await new RoomBuilder().withRoomId(roomId).buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .buildAndPersist()

      // Act
      gqlTeacherComment = await setTeacherCommentMutation(
        roomId,
        student.userId,
        commentText,
        endUser,
      )
    })

    after(async () => await dbDisconnect())

    it('returns non-null/undefined teacherComment', () => {
      expect(gqlTeacherComment).to.not.be.null
      expect(gqlTeacherComment).to.not.be.undefined
    })

    // it('returns teacherComment with expected created date', () => {
    //   expect(gqlTeacherComment?.date).is.equal(Date.now())
    // })

    // it('returns teacherComment with expected updated date', () => {
    //   expect(gqlTeacherComment?.lastUpdated).is.equal(Date.now())
    // })

    it('returns teacherComment with expected comment', () => {
      expect(gqlTeacherComment?.comment).is.equal(commentText)
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

    it('DB: 1 comment', async () => {
      const count = await teacherCommentRepo().count()
      expect(count).to.equal(1)
    })

    it('DB: TeacherComment has expected values', async () => {
      const actual = await teacherCommentRepo().findOneOrFail()
      const expected: FindConditions<TeacherComment> = {
        roomId: roomId,
        teacherId: endUser.userId,
        studentId: student.userId,
        comment: commentText,
        roomRoomId: roomId,
      }
      expect(actual).to.deep.include(expected)
    })
  })

  context('1 existing comment matching provided arguments', () => {
    const roomId = 'room1'
    let endUser: EndUser
    let gqlTeacherComment: GqlTeacherComment | undefined | null
    let student: User
    const originalCommentText = 'not bad'
    const newCommentText = 'great job!'
    let originalComment: TeacherComment

    before(async () => {
      // Arrange
      await dbConnect()
      endUser = await new EndUserBuilder().authenticate().buildAndPersist()
      student = await new UserBuilder().buildAndPersist()
      const room = await new RoomBuilder().withRoomId(roomId).buildAndPersist()
      const schedule = await new ScheduleBuilder()
        .withRoomId(roomId)
        .buildAndPersist()
      originalComment = await new TeacherCommentBuilder()
        .withRoomId(roomId)
        .withTeacherId(endUser.userId)
        .withStudentId(student.userId)
        .withComment(originalCommentText)
        .buildAndPersist()
      //const commentByAnotherTeacher = await new TeacherCommentBuilder().buildAndPersist()

      // Act
      gqlTeacherComment = await setTeacherCommentMutation(
        roomId,
        student.userId,
        newCommentText,
        endUser,
      )
    })

    after(async () => await dbDisconnect())

    it('returns non-null/undefined teacherComment', () => {
      expect(gqlTeacherComment).to.not.be.null
      expect(gqlTeacherComment).to.not.be.undefined
    })

    it('returns teacherComment with new comment text', () => {
      expect(gqlTeacherComment?.comment).is.equal(newCommentText)
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

    it('DB: 1 TeacherComment exists', async () => {
      const count = await teacherCommentRepo().count()
      expect(count).to.equal(1)
    })

    it('DB: TeacherComment has expected values', async () => {
      const actual = await teacherCommentRepo().findOneOrFail()
      const expected: FindConditions<TeacherComment> = {
        roomId: roomId,
        teacherId: endUser.userId,
        studentId: student.userId,
        comment: newCommentText,
        roomRoomId: roomId,
        date: originalComment.date,
      }
      expect(actual).to.deep.include(expected)
    })
  })

  context(
    '1 existing comment for same room/teacher but different student',
    () => {
      const roomId = 'room1'
      let endUser: EndUser
      let gqlTeacherComment: GqlTeacherComment | undefined | null
      let student: User
      let someOtherStudent: User
      const commentText = 'great job!'
      let commentForSomeOtherStudent: TeacherComment

      before(async () => {
        // Arrange
        await dbConnect()
        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        someOtherStudent = await new UserBuilder().buildAndPersist()
        const room = await new RoomBuilder()
          .withRoomId(roomId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .buildAndPersist()
        commentForSomeOtherStudent = await new TeacherCommentBuilder()
          .withRoomId(roomId)
          .withTeacherId(endUser.userId)
          .withStudentId(someOtherStudent.userId)
          .withComment('needs some work')
          .buildAndPersist()

        // Act
        gqlTeacherComment = await setTeacherCommentMutation(
          roomId,
          student.userId,
          commentText,
          endUser,
        )
      })

      after(async () => await dbDisconnect())

      it('returns non-null/undefined teacherComment', () => {
        expect(gqlTeacherComment).to.not.be.null
        expect(gqlTeacherComment).to.not.be.undefined
      })

      it('returns teacherComment with expected comment text', () => {
        expect(gqlTeacherComment?.comment).is.equal(commentText)
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

      it('DB: 2 TeacherComments exist', async () => {
        const count = await teacherCommentRepo().count()
        expect(count).to.equal(2)
      })

      it('DB: new TeacherComment has expected values', async () => {
        const actual = await teacherCommentRepo().findOne({
          where: { studentId: student.userId },
        })
        const expected: FindConditions<TeacherComment> = {
          roomId: roomId,
          teacherId: endUser.userId,
          studentId: student.userId,
          comment: commentText,
          roomRoomId: roomId,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: other TeacherComment is not modified', async () => {
        const actual = await teacherCommentRepo().findOne({
          where: { studentId: someOtherStudent.userId },
        })
        const expected: FindConditions<TeacherComment> = {
          roomId: roomId,
          teacherId: endUser.userId,
          studentId: someOtherStudent.userId,
          comment: commentForSomeOtherStudent.comment,
          roomRoomId: roomId,
          date: commentForSomeOtherStudent.date,
          lastUpdated: commentForSomeOtherStudent.lastUpdated,
        }
        expect(actual).to.deep.equal(expected)
      })
    },
  )

  context(
    '1 existing comment for same teacher/student but different room',
    () => {
      const roomId = 'room1'
      const someOtherRoomId = 'room2'
      let endUser: EndUser
      let gqlTeacherComment: GqlTeacherComment | undefined | null
      let student: User
      const commentText = 'great job!'
      let commentForSomeOtherRoom: TeacherComment

      before(async () => {
        // Arrange
        await dbConnect()
        endUser = await new EndUserBuilder().authenticate().buildAndPersist()
        student = await new UserBuilder().buildAndPersist()
        const room = await new RoomBuilder()
          .withRoomId(roomId)
          .buildAndPersist()
        const someOtherRoom = await new RoomBuilder()
          .withRoomId(someOtherRoomId)
          .buildAndPersist()
        const schedule = await new ScheduleBuilder()
          .withRoomId(roomId)
          .buildAndPersist()
        commentForSomeOtherRoom = await new TeacherCommentBuilder()
          .withRoomId(someOtherRoomId)
          .withTeacherId(endUser.userId)
          .withStudentId(student.userId)
          .withComment('needs some work')
          .buildAndPersist()

        // Act
        gqlTeacherComment = await setTeacherCommentMutation(
          roomId,
          student.userId,
          commentText,
          endUser,
        )
      })

      after(async () => await dbDisconnect())

      it('returns non-null/undefined teacherComment', () => {
        expect(gqlTeacherComment).to.not.be.null
        expect(gqlTeacherComment).to.not.be.undefined
      })

      it('returns teacherComment with expected comment text', () => {
        expect(gqlTeacherComment?.comment).is.equal(commentText)
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

      it('DB: 2 TeacherComments exist', async () => {
        const count = await teacherCommentRepo().count()
        expect(count).to.equal(2)
      })

      it('DB: new TeacherComment has expected values', async () => {
        const actual = await teacherCommentRepo().findOne({
          where: { roomId },
        })
        const expected: FindConditions<TeacherComment> = {
          roomId: roomId,
          teacherId: endUser.userId,
          studentId: student.userId,
          comment: commentText,
          roomRoomId: roomId,
        }
        expect(actual).to.deep.include(expected)
      })

      it('DB: other TeacherComment is not modified', async () => {
        const actual = await teacherCommentRepo().findOne({
          where: { roomId: someOtherRoomId },
        })
        const expected: FindConditions<TeacherComment> = {
          roomId: someOtherRoomId,
          teacherId: endUser.userId,
          studentId: student.userId,
          comment: commentForSomeOtherRoom.comment,
          roomRoomId: someOtherRoomId,
          date: commentForSomeOtherRoom.date,
          lastUpdated: commentForSomeOtherRoom.lastUpdated,
        }
        expect(actual).to.deep.equal(expected)
      })
    },
  )
})
