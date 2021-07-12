import { getRepository } from 'typeorm'
import { User } from '../../src/db/users/entities'
import { sign, SignOptions } from 'jsonwebtoken'
import UserBuilder from './userBuilder'
import EndUser from '../entities/endUser'
import { debugJwtIssuer } from '../../src/auth/auth'
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
      token: this.isAuthenticated ? this.generateToken() : undefined,
    }
  }

  public async buildAndPersist(): Promise<EndUser> {
    const entity = this.build()
    await getRepository(User, USERS_CONNECTION_NAME).save(entity)
    return entity
  }

  private generateToken(): string {
    const payload = {
      id: this.userId,
      email: this.email,
      iss: debugJwtIssuer.options.issuer,
    }
    const signOptions: SignOptions = {
      expiresIn: this.isExpired ? '0s' : '2000s',
    }
    const token = sign(payload, debugJwtIssuer.secretOrPublicKey, signOptions)
    return token
  }
}
