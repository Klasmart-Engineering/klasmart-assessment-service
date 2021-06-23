import { getRepository } from 'typeorm'
import { v4 } from 'uuid'
import { USERS_CONNECTION_NAME } from '../../src/db/users/connectToUserDatabase'
import { User } from '../../src/db/users/entities/user'
import { Mutable } from '../utils/mutable'

export default class UserBuilder {
  protected static givenNameCounter = 1
  protected static familyNameCounter = 1
  protected userId = v4()
  protected givenName = `First${UserBuilder.givenNameCounter++}`
  protected familyName = `Last${UserBuilder.familyNameCounter++}`
  protected email = `abc${UserBuilder.givenNameCounter++}@gmail.com`

  public withUserId(value: string): this {
    this.userId = value
    return this
  }

  public withGivenName(value: string): this {
    this.givenName = value
    return this
  }

  public withFamilyName(value: string): this {
    this.familyName = value
    return this
  }

  public withEmail(value: string): this {
    this.email = value
    return this
  }

  public build(): User {
    const user = new User()
    const mutableUser: Mutable<User> = user
    mutableUser.userId = this.userId
    mutableUser.givenName = this.givenName
    mutableUser.familyName = this.familyName
    mutableUser.email = this.email
    return user
  }

  public async buildAndPersist(): Promise<User> {
    const entity = this.build()
    return await getRepository(User, USERS_CONNECTION_NAME).save(entity)
  }
}
