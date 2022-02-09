/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { withCorrelation } from 'kidsloop-nodejs-logger'
import { Resolver, Query } from 'type-graphql'
import { Service } from 'typedi'

@Service()
@Resolver()
export class ReadyResolver {
  @Query((returns: any) => Boolean)
  ready(): boolean {
    console.log(`Correlation in ready: ${withCorrelation()}`)
    return true
  }
}
