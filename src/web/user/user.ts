import { gql, request } from 'graphql-request'
import { Field, ObjectType } from 'type-graphql'
import { Service } from 'typedi'
import { getConfig, Configuration } from '../../initialization/configuration'

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

interface UserNodeResult {
  id: string
  givenName?: string
  familyName?: string
  avatar?: string
  contactInfo: ContactInfo
}

interface ContactInfo {
  email?: string
  phone?: string
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
  readonly config: Configuration = getConfig()

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

    if (!data.userNode) {
      return undefined
    }
    return convertUserNodeResultToTypedUser(data.userNode)
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
