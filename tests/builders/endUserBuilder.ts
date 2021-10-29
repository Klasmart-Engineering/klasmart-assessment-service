import { getRepository } from 'typeorm'
import { User } from '../../src/db/users/entities'
import UserBuilder from './userBuilder'
import EndUser from '../entities/endUser'
import { generateAuthenticationToken } from '../utils/generateToken'
import { USERS_CONNECTION_NAME } from '../../src/db/users/connectToUserDatabase'

export default class EndUserBuilder extends UserBuilder {
  private isAuthenticated = false
  private isExpired = false

  public authenticate(): this {
    this.isAuthenticated = true
    return this
  }

  public dontAuthenticate(): this {
    this.isAuthenticated = false
    return this
  }

  public expiredToken(): this {
    this.isAuthenticated = true
    this.isExpired = true
    return this
  }

  public build(): EndUser {
    const user = super.build()
    return {
      ...user,
      token: this.isAuthenticated
        ? generateAuthenticationToken(this.userId, this.email, this.isExpired)
        : undefined,
    }
  }

  public async buildAndPersist(): Promise<EndUser> {
    const entity = this.build()
    await getRepository(User, USERS_CONNECTION_NAME).save(entity)
    return entity
  }
}
