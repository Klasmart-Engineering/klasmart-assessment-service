type H5pContent = {
  id: string
  type: string
  subContents: H5pSubContent[]
}

export type H5pSubContent = {
  id: string
  parentId: string
  type: string
  name: string
}

export default H5pContent
