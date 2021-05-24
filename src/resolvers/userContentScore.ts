import { FieldResolver, Resolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Content } from '../db/assessments/entities/material'
import { User } from '../db/assessments/entities/user'
import { UserContentScore } from '../db/assessments/entities/userContentScore'

@Service()
@Resolver(() => UserContentScore)
export default class UserContentScoreResolver {
  constructor() {}

  @FieldResolver(() => User)
  public async user(@Root() userContentScore: UserContentScore): Promise<User> {
    if (userContentScore.user) {
      return userContentScore.user
    }
    return User.random(userContentScore.student_id)
  }

  @FieldResolver(() => Content)
  public async content(
    @Root() userContentScore: UserContentScore,
  ): Promise<Content> {
    if (userContentScore.content) {
      return userContentScore.content
    }
    return Content.random(userContentScore.content_id)
  }
}
