export default class ContentKey {
  public static construct(
    contentId: string,
    subcontentId?: string | null,
  ): string {
    return subcontentId ? `${contentId}|${subcontentId}` : contentId
  }

  public static deconstruct(contentKey: string): {
    contentId: string
    subcontentId?: string
  } {
    const ids = contentKey.split('|', 2)
    const contentId = ids[0]
    const subcontentId = ids.length >= 2 ? ids[1] : undefined
    return { contentId, subcontentId }
  }
}
