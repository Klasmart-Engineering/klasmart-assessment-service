import UserBuilder from './userBuilder'
import EndUser from '../entities/endUser'
import { generateAuthenticationToken } from '../utils/generateToken'

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
}
