import { User } from '../../src/web/user/user'

export default class EndUser extends User {
  private _token?: string

  get token(): string | undefined {
    return this._token
  }
}
