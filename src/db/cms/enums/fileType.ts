import { registerEnumType } from 'type-graphql'

export enum FileType {
  Image = 1,
  Video = 2,
  Audio = 3,
  Document = 4,
  H5P = 5,
  H5PExtension = 6,
}

registerEnumType(FileType, {
  name: 'FileType',
})
