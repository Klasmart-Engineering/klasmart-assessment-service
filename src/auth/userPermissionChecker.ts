import fetch from 'node-fetch'
import { Service } from 'typedi'

@Service({ type: UserPermissionChecker })
export class UserPermissionChecker {
  public async hasPermission(query: string): Promise<boolean> {
    const userServiceUrl = process.env.USER_SERVICE_API_URL || ''

    const fetchPromise = fetch(userServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    const response = await fetchPromise
    if (
      !(
        response.ok &&
        (await response.json())?.data?.user?.membership?.checkAllowed
      )
    ) {
      return false
    }

    return true
  }
}
