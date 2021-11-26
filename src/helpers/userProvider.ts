import { Service } from 'typedi'
import { UserApi, User } from '../web/user'

@Service()
export class UserProvider {
  public constructor(private readonly userApi: UserApi) {}

  public async getUser(
    userId: string,
    authorizationToken?: string,
  ): Promise<User | undefined> {
    const user = await this.userApi.fetchUser(userId, authorizationToken)
    return user
  }
}
