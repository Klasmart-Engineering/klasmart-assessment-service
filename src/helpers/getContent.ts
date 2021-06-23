import { Repository } from 'typeorm'
import { Content } from '../db/cms/entities/content'
import { ContentType } from '../db/cms/enums/contentType'

export default async function getContent(
  contentId: string,
  contentType: string | undefined,
  contentRepository: Repository<Content>,
): Promise<Content | null> {
  const ids = contentId.split('|', 2)
  const mainContentId = ids[0]
  const subcontentId = ids.length >= 2 ? ids[1] : undefined
  let content = (await contentRepository.findOne(mainContentId)) || null

  if (!content) {
    // It's not a cms content id, so let's check if it's an h5p id.
    content =
      (await contentRepository
        .createQueryBuilder()
        .where({ content_type: ContentType.LessonMaterial })
        .andWhere(`data->"$.source" = :source`, {
          source: mainContentId,
        })
        .getOne()) || null

    if (content) {
      content.h5p_id = mainContentId
      content.subcontent_id = subcontentId
      content.type = contentType
    }
  }

  return content
}
