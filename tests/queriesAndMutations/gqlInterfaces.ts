export interface RoomQuery {
  room_id?: string
  scores?: ScoresQuery[]
}

export interface ScoresQuery {
  seen?: boolean
  user?: UserQuery
  content?: ContentQuery
  score?: ScoreSummaryQuery
  teacherScores?: TeacherScoreQuery[]
}

export interface UserQuery {
  user_id?: string
  given_name?: string
  family_name?: string
}

export interface ContentQuery {
  content_id?: string
  subcontent_id: string | null
  type?: string
  name?: string
  h5p_id?: string
  fileType?: string
}

export interface TeacherScoreQuery {
  date?: Date
  lastUpdated?: Date
  score?: number
  teacher?: UserQuery
  student?: UserQuery
  content?: ContentQuery
}

export interface ScoreSummaryQuery {
  min?: number
  max?: number
  sum?: number
  scoreFrequency?: number
  mean?: number
  scores?: number[]
  answers?: AnswerQuery[]
  median?: number
  medians?: number[]
}

export interface AnswerQuery {
  date?: Date
  answer?: string
  score?: number
  minimumPossibleScore?: number
  maximumPossibleScore?: number
}
