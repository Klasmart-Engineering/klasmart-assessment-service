import { Repository } from 'typeorm'
import { Content } from './db/cms/entities/content'

export default async function getContent(
  contentId: string,
  contentRepository: Repository<Content>,
) {
  const content =
    (await contentRepository
      .createQueryBuilder()
      .where({ content_type: 1 })
      .andWhere(`data->"$.source" = :contentId`, {
        contentId,
      })
      .getOne()) || null

  if (content) {
    content.h5p_id = contentId
  }

  return content
}
