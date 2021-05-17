import { Content } from "./resolvers/material"
import { User } from "./resolvers/user"

export function randomInt(range: number, min = 0, skew = 1) {
    return min + Math.floor(range*Math.pow(Math.random(), skew))
}

export function pick<T>(things: T[]): T {
    const index = Math.floor(Math.random()*things.length)
    return things[index]
}

const adjectives = [
    'Awesome',
    'Brilliant',
    'Clever',
    'Dependable',
    undefined,
]

const names = [
    'Alice',
    'Bob',
    'Chris',
    'Dave',
    undefined,
]

export function randomArray<T>(count: number, initializer: () => T): T[] {
    return new Array(count).fill(undefined).map(initializer)
}

export function randomUser() {
    return new User(
        pick(adjectives),
        pick(names)
    )
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

export function randomContent() {
    return new Content(
        pick(activity_names),
        randomInt(20),
        randomInt(3,0),
    )
}

export function randomContents(count: number) {
    return randomArray(count, randomContent)
}