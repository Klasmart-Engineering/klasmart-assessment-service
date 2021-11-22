import { gql, request } from 'graphql-request'
import { Field, ObjectType } from 'type-graphql'
import { Service } from 'typedi'
import { getConfig, Configuration } from '../helpers/configuration'

@ObjectType()
export class User {
  @Field({ name: 'userId' })
  @Field({ name: 'user_id' })
  public readonly userId!: string

  @Field({ name: 'givenName', nullable: true })
  @Field({ name: 'given_name', nullable: true })
  public readonly givenName?: string

  @Field({ name: 'familyName', nullable: true })
  @Field({ name: 'family_name', nullable: true })
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

// to deprecate
interface UserResult {
  user_id: string
  full_name?: string
  given_name?: string
  email?: string
}

// to deprecate
const convertUserResultToTypedUser = (result: UserResult): User => {
  const user = {
    userId: result.user_id,
    givenName: result.given_name,
    familyName: result.full_name,
    email: result?.email,
  }
  return user
}

@Service('UserApi')
export class UserApi {
  readonly config: Configuration = getConfig()

  fetchUser = async (
    id: string,
    authorizationToken?: string,
  ): Promise<User | undefined> => {
    const requestHeaders = {
      authorization: authorizationToken || '',
    }

    const data: { userNode: UserNodeResult; user: UserResult } = await request(
      this.config.USER_SERVICE_ENDPOINT,
      GET_USER_NODE,
      { id },
      requestHeaders,
    )

    // if (!data.userNode) {
    //   return undefined
    // }
    // return convertUserNodeResultToTypedUser(data.userNode)

    // to deprecate
    if (!data.user) {
      return undefined
    }
    return convertUserResultToTypedUser(data.user)
  }
}

const GET_USER_NODE = gql`
  query Query($id: ID!) {
    # to deprecate
    user(user_id: $id) {
      user_id
      full_name
      given_name
      email
    }

    ## future query
    # userNode(id: $id) {
    #   id
    #   givenName
    #   familyName
    #   avatar
    #   contactInfo {
    #     email
    #     phone
    #   }
    # }
  }
`
