import {
  Answer,
  TeacherScore,
  UserContentScore,
} from '../db/assessments/entities'
import { Content, Schedule } from '../db/cms/entities'
import { LessonPlan } from '../db/cms/entities/lessonPlan'
import { LessonPlanItem } from '../db/cms/entities/lessonPlanItem'
import { ContentType } from '../db/cms/enums/contentType'
import { Connection, getManager } from 'typeorm'

export async function migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
  cmsDbConnection: Connection,
  assessmentDbConnection: Connection,
  readOnlyRun = true,
): Promise<void> {
  const contentRepo = cmsDbConnection.getRepository(Content)
  const scheduleRepo = cmsDbConnection.getRepository(Schedule)
  const userContentScoreRepo = assessmentDbConnection.getRepository(
    UserContentScore,
  )
  const planRepo = cmsDbConnection.getRepository(LessonPlan)
  const materials = await contentRepo.find({
    where: { contentType: ContentType.LessonMaterial },
  })
  const ucsList = await userContentScoreRepo.find()

  const h5pIdToContentIdsMap = new Map<
    string,
    { contentId: string; publishStatus: string }[]
  >()
  for (const x of materials) {
    if (!x.h5pId) continue
    const contentIds = h5pIdToContentIdsMap.get(x.h5pId) || []
    h5pIdToContentIdsMap.set(x.h5pId, contentIds)
    contentIds.push({ contentId: x.contentId, publishStatus: x.publishStatus })
  }

  const totalUcs = ucsList.length
  let ucsReqUpdateCount = 0
  const updates: {
    roomId: string
    oldContentId: string
    newContentId: string
  }[] = []

  const roomIdToLessonMaterialIdsCache = new Map<string, string[]>()
  const cache = new Set<string>()

  for (const ucs of ucsList) {
    const roomId = ucs.roomId
    const oldContentId = ucs.contentId
    const idParts = oldContentId.split('|', 2)
    const oldMainContentId = idParts[0]
    const subcontentId = idParts.length >= 2 ? idParts[1] : undefined

    const realContentIds = h5pIdToContentIdsMap.get(oldMainContentId)
    if (!realContentIds) {
      //console.log('ucs already has a real content id')
      continue
    }
    ucsReqUpdateCount += 1
    let lessonMaterialIds = roomIdToLessonMaterialIdsCache.get(ucs.roomId)
    if (!lessonMaterialIds) {
      const schedule = await scheduleRepo.findOne({ where: { id: ucs.roomId } })
      if (!schedule) {
        console.log('schedule not found')
      }
      const plan = await planRepo.findOne({
        where: { contentId: schedule?.lessonPlanId },
      })
      if (!plan) {
        console.log('plan not found')
      }
      lessonMaterialIds = parsePlan(plan)
      roomIdToLessonMaterialIdsCache.set(ucs.roomId, lessonMaterialIds)
    }

    let newMainContentId: string | undefined
    for (let index = 0; index < realContentIds.length; index++) {
      if (lessonMaterialIds.includes(realContentIds[index].contentId)) {
        newMainContentId = realContentIds[index].contentId
        break
      }
    }
    if (!newMainContentId) {
      // console.log(
      //   'a content id was found but it does not match any of the lesson plan content ids',
      //   oldContentId,
      // )
      cache.add(oldContentId)
      const publishedContent = realContentIds.find(
        (x) => x.publishStatus === 'published',
      )
      newMainContentId =
        publishedContent?.contentId ?? realContentIds[0].contentId
    }

    const newContentId = subcontentId
      ? `${newMainContentId}|${subcontentId}`
      : `${newMainContentId}`
    updates.push({ roomId, oldContentId, newContentId })
  }

  console.log(`# of ids that don't match lesson plan: ${cache.size}`)
  console.log(`ucsReqUpdateCount: ${ucsReqUpdateCount}/${totalUcs}`)

  if (readOnlyRun) {
    return
  }
  await getManager(assessmentDbConnection.name).transaction(async (manager) => {
    for (const { roomId, oldContentId, newContentId } of updates) {
      await Promise.all([
        manager.update(
          UserContentScore,
          { roomId: roomId, contentId: oldContentId },
          { contentId: newContentId },
        ),
        manager.update(
          TeacherScore,
          { roomId: roomId, fullContentId: oldContentId },
          { fullContentId: newContentId },
        ),
        manager.update(
          Answer,
          { roomId: roomId, fullContentId: oldContentId },
          { fullContentId: newContentId },
        ),
      ])
    }
  })
}

function parsePlan(lessonPlan?: LessonPlan) {
  if (!lessonPlan) return []
  const list = []
  const q = []
  q.push(lessonPlan.data)
  while (q.length > 0) {
    const current = q.shift()
    let next: JSON[] | undefined
    if (current && 'next' in current) {
      next = current['next'] as JSON[]
      delete current['next']
    }
    if (next) {
      next.forEach((x) => q.push(x))
    }
    list.push(new LessonPlanItem(current))
  }
  return list.map((x) => x.materialId)
}
