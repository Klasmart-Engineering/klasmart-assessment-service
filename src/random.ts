export function randomInt(range: number, min = 0, skew = 1) {
  return min + Math.floor(range * Math.pow(Math.random(), skew))
}

export function pick<T>(things: T[]): T {
  const index = Math.floor(Math.random() * things.length)
  return things[index]
}

export function randomArray<T>(count: number, initializer: () => T): T[] {
  return new Array(count).fill(undefined).map(initializer)
}

export function randomBool(chance = 0.5) {
  return Math.random() < chance
}
