#!/usr/bin/env ts-node
/**
 * Signature:
 * ----------
 *
 *    ./scripts/jwt.ts [USER_ID] [--id USER_ID] [--secret SECRET] [--email EMAIL]
 *
 */
import { sign, Secret, SignOptions } from 'jsonwebtoken'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))

const payload = {
  iss: 'calmid-debug',
  id: args._?.[0] || args.id || process.env.USER_ID || '',
  email: args.email || '',
}

const DEFAULT_KEY = 'iXtZx1D5AqEB0B9pfn+hRQ=='
const secretOrPrivateKey: Secret = args.secret || DEFAULT_KEY

const options: SignOptions = {
  algorithm: 'HS256',
  header: {
    alg: 'HS256',
    typ: 'JWT',
  },
}

console.log({ payload, secretOrPrivateKey, options })

const output = sign(payload, secretOrPrivateKey, options)

console.log('\nOutput')
console.log('======================')
console.log(output)
