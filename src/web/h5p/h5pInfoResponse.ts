export type H5PInfoResponse = {
  contents: H5pInfoDto[]
}

export type H5pInfoDto = {
  id: string
  type: string
  subContents?: H5pInfoDto[]
}
