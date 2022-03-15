import { ApolloError } from 'apollo-server-express'
import {
  gql,
  request,
  batchRequests,
  BatchRequestDocument,
} from 'graphql-request'
import { withLogger } from 'kidsloop-nodejs-logger'
import { Field, ObjectType } from 'type-graphql'
import { Service } from 'typedi'
import { getConfig, Configuration } from '../../initialization/configuration'

const logger = withLogger('UserApi')

@ObjectType()
export class User {
  @Field({ name: 'userId' })
  @Field({ name: 'user_id', deprecationReason: 'use userId instead' })
  public readonly userId!: string

  @Field({ name: 'givenName', nullable: true })
  @Field({
    name: 'given_name',
    deprecationReason: 'use givenName instead',
    nullable: true,
  })
  public readonly givenName?: string

  @Field({ name: 'familyName', nullable: true })
  @Field({
    name: 'family_name',
    deprecationReason: 'use familyName instead',
    nullable: true,
  })
  public readonly familyName?: string

  @Field({ nullable: true })
  public readonly email?: string
}

export class UserClass {
  readonly userId: string
  readonly givenName?: string
  readonly familyName?: string
  readonly email?: string

  constructor(props: User) {
    this.userId = props.userId
    this.givenName = props.givenName
    this.familyName = props.familyName
    this.email = props.email
  }
}

type BatchedQueryUserNodeResult = {
  data: {
    userNode: UserNodeResult | undefined
  }
  errors: any
}

export type BatchedQueryUser =
  | {
      data: {
        user: User
      }
      errors: undefined
    }
  | {
      data: undefined
      errors: ApolloError[]
    }

interface UserNodeResult {
  id: string
  givenName?: string
  familyName?: string
  avatar?: string
  contactInfo: ContactInfo
}

interface ContactInfo {
  email: string
  phone: string
}

const convertUserNodeResultToTypedUser = (result: UserNodeResult): User => {
  const user = {
    userId: result.id,
    givenName: result.givenName,
    familyName: result.familyName,
    email: result.contactInfo?.email,
  }
  return user
}

@Service()
export class UserApi {
  public readonly config: Configuration = getConfig()

  fetchUser = async (
    id: string,
    authorizationToken?: string,
  ): Promise<User | undefined> => {
    const requestHeaders = {
      authorization: authorizationToken || '',
    }

    const data: { userNode: UserNodeResult } = await request(
      this.config.USER_SERVICE_ENDPOINT,
      GET_USER_NODE,
      { id },
      requestHeaders,
    )

    logger.debug(
      `fetchUser >> id: ${id}, ${data.userNode ? 'FOUND' : 'NOT FOUND'}`,
    )
    if (!data.userNode) {
      return undefined
    }
    return convertUserNodeResultToTypedUser(data.userNode)
  }

  public batchFetchUsers = async (
    userIds: ReadonlyArray<string>,
    authorizationToken?: string,
  ): Promise<Map<string, BatchedQueryUser>> => {
    logger.debug(`batchFetchUsers >> userIds count: ${userIds.length}`)

    const requestHeaders = {
      authorization: authorizationToken || '',
    }
    const requests: BatchRequestDocument[] = userIds.map((userId) => ({
      document: GET_USER_NODE,
      variables: { id: userId },
    }))

    const results: BatchedQueryUserNodeResult[] = await batchRequests(
      this.config.USER_SERVICE_ENDPOINT,
      requests,
      requestHeaders,
    )

    const map = new Map<string, BatchedQueryUser>()
    results.forEach(({ data, errors }, idx) => {
      map.set(userIds[idx], {
        data: data.userNode
          ? { user: convertUserNodeResultToTypedUser(data.userNode) }
          : undefined,
        errors,
      })
    })

    return map
  }
}

const GET_USER_NODE = gql`
  query Query($id: ID!) {
    userNode(id: $id) {
      id
      givenName
      familyName
      avatar
      contactInfo {
        email
        phone
      }
    }
  }
`
