import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'

import { Context } from '../auth/context'
import { TeacherCommentsByStudent } from '../graphql'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('TeacherCommentsByStudentResolver')

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherCommentsByStudent,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    logger.debug(
      `TeacherCommentsByStudent { studentId: ${source.studentId} } >> student`,
    )
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }
}
