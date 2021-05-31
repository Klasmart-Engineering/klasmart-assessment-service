import { registerEnumType } from 'type-graphql'

export enum MaterialInputSource {
  H5P = 1,
  Disk = 2,
  Assets = 3,
}

registerEnumType(MaterialInputSource, {
  name: 'MaterialInputSource',
})
