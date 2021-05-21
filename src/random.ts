import { Answer } from './db/assessments/entities/answer'
import { Content } from './db/assessments/entities/material'
import { TeacherComment } from './db/assessments/entities/teacherComments'
import { User } from './db/assessments/entities/user'
import { UserContentScore } from './db/assessments/entities/userContentScore'

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

export function randomUser(): User {
  return new User(pick(adjectives), pick(names))
}

export function randomUsers(count: number): User[] {
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

export function randomBool(chance = 0.5) {
  return Math.random() < chance
}
