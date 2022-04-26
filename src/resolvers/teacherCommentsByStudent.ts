import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'

import { TeacherCommentsByStudent } from '../graphql'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('TeacherCommentsByStudentResolver')

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public student(@Root() source: TeacherCommentsByStudent): User {
    logger.debug(
      `TeacherCommentsByStudent { studentId: ${source.studentId} } >> student`,
    )
    return { userId: source.studentId }
  }
}
