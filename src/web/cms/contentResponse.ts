export default interface ContentResponse {
  list: ReadonlyArray<ContentDto>
  student_content_map?: ReadonlyArray<StudentContentMapEntryDto>
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

export interface StudentContentMapEntryDto {
  student_id?: string
  content_ids: ReadonlyArray<string>
}
