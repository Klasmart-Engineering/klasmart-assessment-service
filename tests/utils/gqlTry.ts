/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpQueryError, GraphQLResponse } from 'apollo-server-core'
import { ApolloServerTestClient } from './createTestClient'
import { Headers } from 'node-mocks-http'

export async function gqlTryQuery(
  testClient: ApolloServerTestClient,
  gqlQuery: { query: string; variables: any },
  headers?: Headers,
  logErrors = true,
): Promise<Record<string, any> | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: gqlQuery.query,
      variables: gqlQuery.variables,
      headers: headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data
}

export async function gqlTryMutation(
  testClient: ApolloServerTestClient,
  gqlMutation: { query: string; variables: any },
  headers?: Headers,
  logErrors = true,
): Promise<Record<string, any> | null | undefined> {
  const { query } = testClient

  const operation = () =>
    query({
      query: gqlMutation.query,
      variables: gqlMutation.variables,
      headers: headers,
    })

  const res = await gqlTry(operation, logErrors)
  return res.data
}

export async function gqlTry(
  gqlOperation: () => Promise<GraphQLResponse>,
  logErrors: boolean,
): Promise<GraphQLResponse> {
  try {
    const res = await gqlOperation()
    if (res.errors) {
      if (logErrors) {
        console.error(
          res.errors?.map((x) => JSON.stringify(x, null, 2)).join('\n'),
        )
      }
      throw new Error(res.errors?.map((x) => x.message).join('\n'))
    }
    return res
  } catch (e) {
    if (e instanceof HttpQueryError) {
      console.log(e.stack)
      throw new Error(
        JSON.parse(e.message)
          .errors.map((x: { message: string }) => x.message)
          .join('\n'),
      )
    } else {
      throw e
    }
  }
}
