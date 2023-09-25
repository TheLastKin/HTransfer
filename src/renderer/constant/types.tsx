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
  chapters?: string[],
  createdDate?: number,
  lastModifiedDate?: number
}

type UpdateHistoryProps = {
  name: string,
  path: string,
  tags: Tag[]
}

interface UniqueTag extends Tag {
  numberOfOccurence: number;
}

type UniqueGroup = {
  name: string,
  numberOfTags: number
}

type ModalProps = {
  visible: boolean,
  message: string,
  onSubmit?: () => void,
}

type Action = {
  type: string,
  time: number
}

type ImageFilter = {
  selectedTags: Tag[],
  sortBy: {
    type: string,
    asc: boolean
  },
  extraInfo: {
    showIndex: boolean,
    showName: boolean,
    hasSDPrompt: boolean
  },
  extraSettings: {
    viewByTagOrder: string,
    withoutSelectedTags: boolean
  },
}

const commonTagColor = 'rgb(85, 118, 190)';
const charTagColor = 'rgb(181, 184, 6)';
const specialTagColor = 'rgb(221, 34, 50)';
const activeColor = 'rgb(122, 245, 122)';
const actions = {
  ADD_TAG: "ADD_TAG",
  ADD_TAG_TO_IMAGE: "ADD_TAG_TO_IMAGE",
  ADD_CHAPTER: "ADD_CHAPTER",
  ADD_CHAPTER_IMAGE: "ADD_CHAPTER_IMAGE",
  DELETE_TAG_FROM_IMAGE: "DELETE_TAG_FROM_IMAGE"
}
const initFilter: ImageFilter = {
  selectedTags: [],
  sortBy: {
    type: "Date created",
    asc: false
  },
  extraInfo: {
    showIndex: false,
    showName: false,
    hasSDPrompt: false
  },
  extraSettings: {
    viewByTagOrder: "",
    withoutSelectedTags: false
  }
}

export {
  Chapter,
  ImageInfo,
  UpdateHistoryProps,
  Tag,
  UniqueTag,
  UniqueGroup,
  ModalProps,
  Action,
  ImageFilter,
  commonTagColor,
  charTagColor,
  specialTagColor,
  activeColor,
  actions,
  initFilter
}
