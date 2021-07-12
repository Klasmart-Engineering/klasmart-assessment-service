import {
  Answer,
  TeacherScore,
  UserContentScore,
} from '../db/assessments/entities'
import { Content, Schedule } from '../db/cms/entities'
import { LessonPlan } from '../db/cms/entities/lessonPlan'
import { ContentType } from '../db/cms/enums/contentType'
import { Connection, getManager } from 'typeorm'
import ContentKey from './contentKey'
import { Logger } from './logger'

export async function migrateContentIdColumnsToUseContentIdInsteadOfH5pId(
  cmsDbConnection: Connection,
  assessmentDbConnection: Connection,
  readOnlyRun: boolean,
): Promise<void> {
  const contentRepo = cmsDbConnection.getRepository(Content)
  const scheduleRepo = cmsDbConnection.getRepository(Schedule)
  const userContentScoreRepo = assessmentDbConnection.getRepository(
    UserContentScore,
  )
  const logger = Logger.get('ContentIdMigration')
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
    oldContentKey: string
    newContentKey: string
  }[] = []

  const roomIdToLessonMaterialIdsCache = new Map<string, string[]>()
  const cache = new Set<string>()

  for (const ucs of ucsList) {
    const roomId = ucs.roomId
    const oldContentKey = ucs.contentKey
    const { contentId, subcontentId } = ContentKey.deconstruct(oldContentKey)
    const oldContentId = contentId

    const realContentIds = h5pIdToContentIdsMap.get(oldContentId)
    if (!realContentIds) {
      //logger.info('ucs already has a real content id')
      continue
    }
    ucsReqUpdateCount += 1
    let lessonMaterialIds = roomIdToLessonMaterialIdsCache.get(ucs.roomId)
    if (!lessonMaterialIds) {
      const schedule = await scheduleRepo.findOne({ where: { id: ucs.roomId } })
      if (!schedule) {
        logger.info('schedule not found')
        continue
      }
      const lessonPlan = await planRepo.findOne({
        where: { contentId: schedule.lessonPlanId },
      })
      if (!lessonPlan) {
        logger.info('lesson plan not found')
        continue
      }
      lessonMaterialIds = lessonPlan.materialIds
      roomIdToLessonMaterialIdsCache.set(ucs.roomId, lessonMaterialIds)
    }

    let newContentId: string | undefined
    for (let index = 0; index < realContentIds.length; index++) {
      if (lessonMaterialIds.includes(realContentIds[index].contentId)) {
        newContentId = realContentIds[index].contentId
        break
      }
    }
    if (!newContentId) {
      // logger.info(
      //   'a content id was found but it does not match any of the lesson plan content ids',
      //   oldContentId,
      // )
      cache.add(oldContentKey)
      const publishedContent = realContentIds.find(
        (x) => x.publishStatus === 'published',
      )
      newContentId = publishedContent?.contentId ?? realContentIds[0].contentId
    }

    const newContentKey = ContentKey.construct(newContentId, subcontentId)
    updates.push({
      roomId,
      oldContentKey,
      newContentKey,
    })
  }

  logger.info(`# of ids that don't match lesson plan: ${cache.size}`)
  logger.info(`ucsReqUpdateCount: ${ucsReqUpdateCount}/${totalUcs}`)

  if (readOnlyRun) {
    return
  }
  await getManager(assessmentDbConnection.name).transaction(async (manager) => {
    for (const { roomId, oldContentKey, newContentKey } of updates) {
      await Promise.all([
        manager.update(
          UserContentScore,
          { roomId: roomId, contentKey: oldContentKey },
          { contentKey: newContentKey },
        ),
        manager.update(
          TeacherScore,
          { roomId: roomId, contentKey: oldContentKey },
          { contentKey: newContentKey },
        ),
        manager.update(
          Answer,
          { roomId: roomId, contentKey: oldContentKey },
          { contentKey: newContentKey },
        ),
      ])
    }
  })
}
