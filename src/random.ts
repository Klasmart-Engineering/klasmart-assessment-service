import { User } from "./resolvers/user"

export function randomInt(max: number, min = 0, skew = 1) {
    return min + Math.floor(max*Math.pow(Math.random(), skew))
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

export function randomUser() {
    return new User(
        pick(adjectives),
        pick(names)
    )
}

export function randomUsers(count: number) {
    return new Array(count).fill(undefined).map(
        () => randomUser()
    )
}