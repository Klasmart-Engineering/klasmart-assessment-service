// import { AuthenticationError } from 'apollo-server-express'
import { AuthChecker, MiddlewareFn, ResolverData } from 'type-graphql'
import { Context } from './context'
import { Permission } from './permissions'

export const authChecker: AuthChecker<Context> = async (
  { context: { userId } },
  roles,
) => {
  return userId !== undefined
}

export const roomAuth: MiddlewareFn<Context> = async (
  { args, context }: ResolverData<Context>,
  next,
) => {
  const { room_id } = args
  await context.permissions?.rejectIfNotAllowed(
    { roomId: room_id },
    Permission.assessments_page_406,
  )
  return next()
}

export const mutationAuth: MiddlewareFn<Context> = async (
  { args, context }: ResolverData<Context>,
  next,
) => {
  const { room_id, student_id } = args
  await context.permissions?.rejectIfNotAllowed(
    { roomId: room_id, studentId: student_id },
    Permission.edit_in_progress_assessment_439,
  )
  return next()
}
