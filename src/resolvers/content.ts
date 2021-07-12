import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Content } from '../db/cms/entities'
import { FileType } from '../db/cms/enums'

@Service()
@Resolver(() => Content)
export default class ContentResolver {
  @FieldResolver(() => FileType, { nullable: true })
  fileType(@Root() content: Content): string | undefined {
    if (content.fileType !== undefined) {
      return content.fileType as never
    }
  }

  @FieldResolver({ nullable: true })
  type(@Root() content: Content): string | undefined {
    if (content.type) {
      return content.type
    }
    return content.fileType !== undefined
      ? FileType[content.fileType]
      : undefined
  }
}
