import { v4 } from 'uuid'
import { User } from '../../src/web/user'

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
    return {
      userId: this.userId,
      givenName: this.givenName,
      familyName: this.familyName,
      email: this.email,
    }
  }
}
