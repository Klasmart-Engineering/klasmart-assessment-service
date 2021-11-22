import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'

import { User } from '../api/user'
import { Context } from '../auth/context'
import { TeacherCommentsByStudent } from '../graphql'
import { UserProvider } from '../helpers/userProvider'

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  public async student(
    @Root() source: TeacherCommentsByStudent,
    @Ctx() context: Context,
  ): Promise<User | undefined> {
    return await this.userProvider.getUser(
      source.studentId,
      context.encodedAuthenticationToken,
    )
  }
}
