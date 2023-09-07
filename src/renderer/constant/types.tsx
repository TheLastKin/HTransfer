type Chapter = {
  name: string,
  images?: ImageInfo[],
  createDate: number,
  modifiedDate: number,
}

type Tag = {
  name: string,
  type: string
}

type ImageInfo = {
  path: string,
  name: string,
  type?: string,
  tags?: Tag[],
  width?: number,
  height?: number,
  rating?: number,
  createdDate?: number,
  lastModifiedDate?: number
}

type UpdateHistoryProps = {
  name: string,
  path: string,
  tags: Tag[]
}

export {
  Chapter,
  ImageInfo,
  UpdateHistoryProps,
  Tag,
}
