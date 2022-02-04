import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'
import { Logger } from 'winston'

import { Context } from '../auth/context'
import { TeacherCommentsByStudent } from '../graphql'
import { UserProvider } from '../providers/userProvider'
import { User } from '../web/user'

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  private static _logger: Logger
  private get Logger(): Logger {
    return (
      TeacherCommentsByStudentResolver._logger ||
      (TeacherCommentsByStudentResolver._logger = withLogger(
        'TeacherCommentsByStudentResolver',
      ))
    )
  }

  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherCommentsByStudent,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    this.Logger.debug(
      `TeacherCommentsByStudent { studentId: ${source.studentId} } >> student`,
    )
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }
}
