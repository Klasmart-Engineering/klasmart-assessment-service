import { Field, ObjectType } from 'type-graphql'
import { v4 } from 'uuid'
import { randomInt, randomUsers, randomArray, pick } from '../../../random'
import { TeacherComment } from './teacherComments'
import { UserContentScore } from './userContentScore'
import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn } from 'typeorm'
import { TeacherScore } from './teacherScore'
import { Answer } from './answer'
import { Content } from '../../../graphql/material'

@Entity({ name: 'assessment_xapi_room' })
@ObjectType()
export class Room {
  @PrimaryColumn({ name: 'room_id' })
  @Field()
  public room_id: string

  @Field(() => [UserContentScore])
  @OneToMany(
    () => UserContentScore,
    (userContentScore) => userContentScore.room,
    { lazy: true },
  )
  public scores!: Promise<UserContentScore[]> | UserContentScore[]

  @Field(() => [TeacherComment])
  @OneToMany(
    () => TeacherComment,
    (userContentScore) => userContentScore.room,
    { lazy: true },
  )
  @JoinColumn({ name: 'room_id', referencedColumnName: 'room_id' })
  public teacherComments!: Promise<TeacherComment[]>

  @Column({ nullable: false })
  public startTime?: Date

  @Column({ nullable: false })
  public endTime?: Date

  @Column({ default: false })
  public recalculate!: boolean

  constructor(room_id = v4(), startTime?: Date, endTime?: Date) {
    this.room_id = room_id
    this.startTime = startTime
    this.endTime = endTime
  }

  public static random(room_id: string = v4()): Room {
    const room = new Room(room_id)
    const students = randomUsers(5)
    const teachers = randomUsers(2)
    const contents = randomArray(randomInt(5), Content.random)

    const oneMinute = 1000 * 60
    const oneYear = oneMinute * 60 * 24 * 365
    const start = Date.now() - randomInt(oneYear, 60 * oneMinute, 0.5)
    const duration = randomInt(90 * oneMinute, 5 * oneMinute, 1.5)
    room.startTime = new Date(start)
    room.endTime = new Date(start + duration)

    const scores: UserContentScore[] = []
    for (const content of contents) {
      for (const user of [...students, ...teachers]) {
        const count = randomInt(10, 0, 2)
        for (let i = 0; i < count; i++) {
          const seen = true
          const answers: Answer[] = []
          const teacherScores: TeacherScore[] = []
          const userContentScore = UserContentScore.new(
            room_id,
            user,
            content,
            answers,
            teacherScores,
            seen,
          )

          const answerCount = randomInt(5)
          const { maximumPossibleScore, minimumPossibleScore } = content
          const range = maximumPossibleScore - minimumPossibleScore
          const mockAnswers = ['yes', 'no', 'maybe', 'number']
          for (let j = 0; j < answerCount; j++) {
            const mockAnswerText = pick(mockAnswers)
            const answer = Answer.new(
              userContentScore,
              new Date(randomInt(duration, start)),
              mockAnswerText === 'number'
                ? randomInt(100).toString()
                : mockAnswerText,
              randomInt(range, minimumPossibleScore),
              minimumPossibleScore,
              maximumPossibleScore,
            )
            answers.push(answer)
          }
          scores.push(userContentScore)
        }
      }
    }
    room.scores = Promise.resolve(scores)

    const teacherComments: TeacherComment[] = randomArray(
      randomInt(students.length * teachers.length),
      () =>
        TeacherComment.new(
          room.room_id,
          pick(teachers),
          pick(students),
          pick(mockTeacherComments),
        ),
    )
    room.teacherComments = Promise.resolve(teacherComments)

    return room
  }
}

const mockTeacherComments = [
  'Good Job!',
  'Almost, please try harder next time.',
  'A great improvement!',
  'Keep up the good work',
]
