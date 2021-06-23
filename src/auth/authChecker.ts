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
  const { roomId } = args
  await context.permissions.rejectIfNotAllowed(
    { roomId: roomId },
    Permission.assessments_page_406,
  )
  return next()
}

export const mutationAuth: MiddlewareFn<Context> = async (
  { args, context }: ResolverData<Context>,
  next,
) => {
  const { roomId, studentId } = args
  await context.permissions.rejectIfNotAllowed(
    { roomId: roomId, studentId: studentId },
    Permission.edit_in_progress_assessment_439,
  )
  return next()
}
