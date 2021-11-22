import { UserClass } from '../../src/api/user'

export default class EndUser extends UserClass {
  public email?: string
  private _token?: string

  get token(): string | undefined {
    return this._token
  }
}
