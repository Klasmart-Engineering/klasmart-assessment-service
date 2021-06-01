import { Resolver, FieldResolver, Root } from 'type-graphql'
import { Service } from 'typedi'
import { Content } from '../db/cms/entities/content'
import { FileType } from '../db/cms/enums/fileType'

@Service()
@Resolver(() => Content)
export default class ContentResolver {
  @FieldResolver(() => FileType, { nullable: true })
  fileType(@Root() content: Content): FileType | undefined {
    if (content.data && 'file_type' in content.data) {
      return content.data['file_type']
    }
  }

  @FieldResolver(() => FileType, { nullable: true })
  type(@Root() content: Content) {
    if (content.type !== undefined) {
      return content.type
    }
    const fileType =
      content.data && 'file_type' in content.data && content.data['file_type']
    if (typeof fileType === 'number') {
      return FileType[fileType]
    }
  }
}
