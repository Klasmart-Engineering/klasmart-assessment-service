export const USER = (title: string): string => `
${title} {
  user_id
  given_name
  family_name
}
`
export interface GqlUser {
  user_id?: string
  given_name?: string
  family_name?: string
}

// ====================================================

export const CONTENT = `
content {
  content_id
  subcontent_id
  type
  name
  h5p_id
  fileType
}
`
export interface GqlContent {
  content_id?: string
  subcontent_id: string | null
  type?: string | null
  name?: string
  h5p_id?: string | null
  fileType?: string
}

// ====================================================

const TEACHER_SCORES = `
teacherScores {
  date
  lastUpdated
  score
  ${USER('teacher')}
  ${USER('student')}
  ${CONTENT}
}
`
export interface GqlTeacherScore {
  date?: Date
  lastUpdated?: Date
  score?: number
  teacher?: GqlUser
  student?: GqlUser
  content?: GqlContent
}

// ====================================================

const ANSWER = `
answers {
  date
  answer
  score
  minimumPossibleScore
  maximumPossibleScore
}
`
export interface GqlAnswer {
  date: Date | null
  answer: string | null
  score: number | null
  minimumPossibleScore?: number
  maximumPossibleScore?: number
}

// ====================================================

const SCORE_SUMMMARY = `
score {
  min
  max
  sum
  scoreFrequency
  mean
  scores
  ${ANSWER}
  median
  medians
}
`
export interface GqlScoreSummary {
  min?: number | null
  max?: number | null
  sum?: number
  scoreFrequency?: number
  mean?: number | null
  scores?: number[]
  answers?: GqlAnswer[]
  median?: number | null
  medians?: number[]
}

// ====================================================

export const CONTENT_SCORES = `
scores {
  seen
  ${TEACHER_SCORES}
  ${USER('user')}
  ${SCORE_SUMMMARY}
  ${CONTENT}
}
`
export interface GqlScore {
  seen?: boolean
  user?: GqlUser
  content?: GqlContent
  score?: GqlScoreSummary
  teacherScores?: GqlTeacherScore[]
}

// ====================================================

export const TEACHER_COMMENTS = `
teacherComments {
  date
  lastUpdated
  comment
  ${USER('teacher')}
  ${USER('student')}
}
`
export interface GqlTeacherComment {
  date?: Date
  lastUpdated?: Date
  comment?: string
  teacher?: GqlUser
  student?: GqlUser
}

// ====================================================

export const SCORES_BY_USER = `
scoresByUser {
  ${USER('user')}
  ${CONTENT_SCORES}
}
`
export interface GqlScoresByUser {
  user?: GqlUser
  scores?: GqlScore[]
}

// ====================================================

export const SCORES_BY_CONTENT = `
scoresByContent {
  ${CONTENT}
  ${CONTENT_SCORES}
}
`
export interface GqlScoresByContent {
  content?: GqlContent
  scores?: GqlScore[]
}

// ====================================================

export const TEACHER_COMMENTS_BY_STUDENT = `
teacherCommentsByStudent {
  ${USER('student')}
  ${TEACHER_COMMENTS}
}
`
export interface GqlTeacherCommentsByStudent {
  student?: GqlUser
  teacherComments?: GqlTeacherComment[]
}
