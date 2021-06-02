import { XAPIRepository } from './db/xapi/repo'

async function main() {
  const repo = new XAPIRepository()
  const events = await repo.searchXApiEvents(
    '70eb76d1-91d3-4edf-9bf6-a2dfcfb51407',
    1623146732782,
    1623146952801,
  )
  console.log(events)
}

;(async () => {
  await main()
})().catch((e) => {
  console.log(e)
})
