import { Answer } from './db/assessments/entities/answer'
import { Content } from './db/assessments/entities/material'
import { TeacherComment } from './db/assessments/entities/teacherComments'
import { User } from './db/assessments/entities/user'

export function randomInt(range: number, min = 0, skew = 1) {
  return min + Math.floor(range * Math.pow(Math.random(), skew))
}

export function pick<T>(things: T[]): T {
  const index = Math.floor(Math.random() * things.length)
  return things[index]
}

const adjectives = [
  'Awesome',
  'Brilliant',
  'Clever',
  'Dependable',
  'Exciting',
  'Fabulous',
  'Gregarious',
  undefined,
]

const names = [
  'Alice',
  'Bob',
  'Chris',
  'Dave',
  'Emily',
  'Fiona',
  'George',
  undefined,
]

export function randomArray<T>(count: number, initializer: () => T): T[] {
  return new Array(count).fill(undefined).map(initializer)
}

export function randomUser() {
  return new User(pick(adjectives), pick(names))
}

export function randomUsers(count: number) {
  return randomArray(count, randomUser)
}

const activity_names = [
  'Matching Words with Pictures',
  'Listen and repeat',
  'Word search',
  'Essay',
  'Video',
]

const activity_types = [
  'Interactive Video',
  'Course Presentation',
  'Multiple Choice',
  'Quiz',
  'Fill in the Blank',
  'Drag the Words',
]

export function randomContent() {
  return new Content(
    pick(activity_names),
    pick(activity_types),
    randomInt(20),
    randomInt(3, 0),
  )
}

export function randomContents(count: number) {
  return randomArray(count, randomContent)
}

const answers = ['yes', 'no', 'maybe', 'number']

export function randomAnswer(
  roomId: string,
  studentId: string,
  contentId: string,
  { maximumPossibleScore, minimumPossibleScore }: Content,
) {
  const range = maximumPossibleScore - minimumPossibleScore
  const answer = pick(answers)
  return new Answer(
    roomId,
    studentId,
    contentId,
    answer === 'number' ? randomInt(100).toString() : answer,
    randomInt(range, minimumPossibleScore),
  )
}

export const teacherComments = [
  'Good Job!',
  'Almost, please try harder next time.',
  'A great improvement!',
  'Keep up the good work',
]
export function randomTeacherComments(
  roomId: string,
  count: number,
  teachers: User[],
  students: User[],
) {
  const comment = pick(teacherComments)
  return randomArray(
    count,
    () =>
      new TeacherComment(
        roomId,
        pick(teachers),
        pick(students),
        pick(teacherComments),
      ),
  )
}

export function randomBool(chance = 0.5) {
  return Math.random() < chance
}
