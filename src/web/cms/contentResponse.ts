export default interface ContentResponse {
  list: ReadonlyArray<ContentDto>
  total: number
}

export interface ContentDto {
  author_id?: string
  content_name?: string
  content_type?: number
  create_at?: number
  data?: string
  id?: string
  publish_status?: string
}
