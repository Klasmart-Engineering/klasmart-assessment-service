import { User } from '../../src/db/users/entities/user'

export default class EndUser extends User {
  public email?: string
  private _token?: string

  get token(): string | undefined {
    return this._token
  }
}
