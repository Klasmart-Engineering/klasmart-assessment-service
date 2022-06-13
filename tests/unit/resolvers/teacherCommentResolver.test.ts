import Substitute, { Arg } from '@fluffy-spoon/substitute'
import expect from '../../utils/chaiAsPromisedSetup'
import { EntityManager } from 'typeorm'
import { TeacherComment } from '../../../src/db/assessments/entities'
import {
  ScheduleBuilder,
  TeacherCommentBuilder,
  UserBuilder,
} from '../../builders'
import TeacherCommentResolver from '../../../src/resolvers/teacherComments'
import { CmsScheduleProvider } from '../../../src/providers/cmsScheduleProvider'
import { ErrorMessage } from '../../../src/helpers/errorMessages'

describe('teacherCommentResolver.setComment', () => {
  context('comment exists', () => {
    it('sets and returns new comment', async () => {
      const schedule = new ScheduleBuilder().build()
      const student = new UserBuilder().build()
      const teacherComment = new TeacherCommentBuilder()
        .withStudentId(student.userId)
        .withRoomId(schedule.id)
        .build()

      const assessmentDB = Substitute.for<EntityManager>()
      const scheduleProvider = Substitute.for<CmsScheduleProvider>()

      assessmentDB
        .findOne(TeacherComment, {
          roomId: teacherComment.roomId,
          studentId: teacherComment.studentId,
          teacherId: teacherComment.teacherId,
        })
        .resolves(teacherComment)
      scheduleProvider.getSchedule(schedule.id, undefined).resolves(schedule)

      const sut = new TeacherCommentResolver(assessmentDB, scheduleProvider)

      // Act
      const actual = await sut.setComment(
        {},
        teacherComment.roomId,
        teacherComment.studentId,
        teacherComment.comment,
        teacherComment.teacherId,
      )

      // Assert
      expect(actual).to.deep.include(teacherComment)
      assessmentDB.received(1).save(TeacherComment, teacherComment)
      assessmentDB.received(1).save(Arg.all())
    })
  })

  context('comment does not exist', () => {
    it('sets and returns new comment', async () => {
      const schedule = new ScheduleBuilder().build()
      const student = new UserBuilder().build()
      const teacherComment = new TeacherCommentBuilder()
        .withStudentId(student.userId)
        .withRoomId(schedule.id)
        .build()

      const assessmentDB = Substitute.for<EntityManager>()
      const scheduleProvider = Substitute.for<CmsScheduleProvider>()

      assessmentDB
        .findOne(TeacherComment, {
          roomId: teacherComment.roomId,
          studentId: teacherComment.studentId,
          teacherId: teacherComment.teacherId,
        })
        .resolves(null)
      scheduleProvider.getSchedule(schedule.id, undefined).resolves(schedule)

      const sut = new TeacherCommentResolver(assessmentDB, scheduleProvider)

      // Act
      const actual = await sut.setComment(
        {},
        teacherComment.roomId,
        teacherComment.studentId,
        teacherComment.comment,
        teacherComment.teacherId,
      )

      // Assert
      expect(actual).to.deep.include(teacherComment)
      assessmentDB.received(1).save(TeacherComment, teacherComment)
      assessmentDB.received(1).save(Arg.all())
    })
  })

  context('comment does not exist; schedule does not exist', () => {
    it('throws "schedule not found" error', async () => {
      const schedule = new ScheduleBuilder().build()
      const student = new UserBuilder().build()
      const teacherComment = new TeacherCommentBuilder()
        .withStudentId(student.userId)
        .withRoomId(schedule.id)
        .build()

      const assessmentDB = Substitute.for<EntityManager>()
      const scheduleProvider = Substitute.for<CmsScheduleProvider>()

      assessmentDB
        .findOne(TeacherComment, {
          roomId: teacherComment.roomId,
          studentId: teacherComment.studentId,
          teacherId: teacherComment.teacherId,
        })
        .resolves(null)
      // ********
      scheduleProvider.getSchedule(schedule.id, undefined).resolves(undefined)
      // ********

      const sut = new TeacherCommentResolver(assessmentDB, scheduleProvider)

      // Act
      const fn = () =>
        sut.setComment(
          {},
          teacherComment.roomId,
          teacherComment.studentId,
          teacherComment.comment,
          teacherComment.teacherId,
        )

      // Assert
      await expect(fn()).to.be.rejectedWith(
        ErrorMessage.scheduleNotFound(teacherComment.roomId),
      )
      assessmentDB.didNotReceive().save(Arg.all())
    })
  })
})
