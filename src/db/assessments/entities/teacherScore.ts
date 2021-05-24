import { ObjectType, Field } from 'type-graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import { UserContentScore } from './userContentScore'

@Entity({ name: 'assessment_xapi_teacher_score' })
@ObjectType()
export class TeacherScore {
  @PrimaryColumn({ name: 'room_id', nullable: false })
  public readonly room_id: string

  @PrimaryColumn({ name: 'student_id', nullable: false })
  public readonly student_id: string

  @PrimaryColumn({ name: 'content_id', nullable: false })
  public readonly content_id: string

  @PrimaryColumn({ name: 'teacher_id', nullable: false })
  public readonly teacher_id: string

  @ManyToOne(
    () => UserContentScore,
    (userContentScore) => userContentScore.teacherScores,
    { lazy: true },
  )
  @JoinColumn([
    { name: 'room_id', referencedColumnName: 'room_id' },
    { name: 'student_id', referencedColumnName: 'student_id' },
    { name: 'content_id', referencedColumnName: 'content_id' },
  ])
  public userContentScore?: Promise<UserContentScore> | UserContentScore

  @Field()
  @CreateDateColumn()
  public date!: Date

  @Field()
  @Column({ nullable: false })
  public score!: number

  constructor(
    roomId: string,
    teacherId: string,
    studentId: string,
    contentId: string,
  ) {
    this.room_id = roomId
    this.teacher_id = teacherId
    this.student_id = studentId
    this.content_id = contentId
  }

  public static new(
    userContentScore: UserContentScore,
    teacherId: string,
    score: number,
    date = new Date(),
  ): TeacherScore {
    const teacherScore = new TeacherScore(
      userContentScore.room_id,
      teacherId,
      userContentScore.student_id,
      userContentScore.content_id,
    )
    teacherScore.userContentScore = userContentScore
    teacherScore.score = score
    teacherScore.date = date

    return teacherScore
  }
}
