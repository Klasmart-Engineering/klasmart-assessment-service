import { withLogger } from '@kl-engineering/kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { TeacherCommentsByStudent } from '../graphql'
import { User } from '../web/user'

const logger = withLogger('TeacherCommentsByStudentResolver')

// TODO: Consider replacing this field resolver with a normal field in the TeacherCommentsByStudent class.
@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  @FieldResolver(() => User, { nullable: true })
  public student(@Root() source: TeacherCommentsByStudent): User {
    logger.debug(
      `TeacherCommentsByStudent { studentId: ${source.studentId} } >> student`,
    )
    return { userId: source.studentId }
  }
}
