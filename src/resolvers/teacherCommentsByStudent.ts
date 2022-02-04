import { ApolloError } from 'apollo-server-express'
import DataLoader from 'dataloader'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Resolver, FieldResolver, Root, Ctx } from 'type-graphql'
import { Service } from 'typedi'

import { Context } from '../auth/context'
import { TeacherCommentsByStudent } from '../graphql'
import {
  UserDataLoader,
  UserDataLoaderFunc,
  UserProvider,
} from '../providers/userProvider'
import { User } from '../web/user'

const logger = withLogger('TeacherCommentsByStudentResolver')

@Service()
@Resolver(() => TeacherCommentsByStudent)
export default class TeacherCommentsByStudentResolver {
  constructor(private readonly userProvider: UserProvider) {}

  @FieldResolver(() => User, { nullable: true })
  @UserDataLoader()
  public async student(
    @Root() source: TeacherCommentsByStudent,
  ): Promise<UserDataLoaderFunc> {
    logger.debug(
      `TeacherCommentsByStudent { studentId: ${source.studentId} } >> student`,
    )
    return async (dataloader: DataLoader<string, ApolloError | User>) =>
      dataloader.load(source.studentId)
  }
}
