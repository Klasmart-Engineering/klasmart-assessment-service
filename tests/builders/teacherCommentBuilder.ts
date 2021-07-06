import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import {
  TeacherComment,
  UserContentScore,
} from '../../src/db/assessments/entities'
import { ASSESSMENTS_CONNECTION_NAME } from '../../src/db/assessments/connectToAssessmentDatabase'

export default class TeacherCommentBuilder {
  private roomId = v4()
  private teacherId = v4()
  private studentId = v4()
  private comment = 'Great job!'

  public withRoomId(value: string): this {
    this.roomId = value
    return this
  }

  public withTeacherId(value: string): this {
    this.teacherId = value
    return this
  }

  public withStudentId(value: string): this {
    this.studentId = value
    return this
  }

  public withComment(value: string): this {
    this.comment = value
    return this
  }

  public build(): TeacherComment {
    const entity = TeacherComment.new(
      this.roomId,
      this.teacherId,
      this.studentId,
      this.comment,
    )
    return entity
  }

  public async buildAndPersist(): Promise<TeacherComment> {
    const entity = this.build()
    return await getRepository(
      TeacherComment,
      ASSESSMENTS_CONNECTION_NAME,
    ).save(entity)
  }
}
