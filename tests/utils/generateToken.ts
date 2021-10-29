import { sign, SignOptions } from 'jsonwebtoken'

export function generateAuthenticationToken(
  userId: string,
  email: string,
  isExpired: boolean,
): string {
  const payload = {
    id: userId,
    email: email,
    iss: 'calmid-debug',
  }
  const signOptions: SignOptions = {
    expiresIn: isExpired ? '0s' : '2000s',
  }
  const token = sign(payload, 'iXtZx1D5AqEB0B9pfn+hRQ==', signOptions)
  return token
}
