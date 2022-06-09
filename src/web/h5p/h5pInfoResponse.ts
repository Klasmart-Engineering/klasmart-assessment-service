export type H5PInfoResponse = {
  contents: H5pInfoDto[]
}

export type H5pInfoDto = {
  id: string
  type: string
  name: string
  subContents?: H5pInfoDto[]
}
