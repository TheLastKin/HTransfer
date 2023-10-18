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

type SDProps = {
  ofImage: string,
  prompt: string
}

type UpdateHistoryProps = {
  name: string,
  path: string,
  tags: Tag[],
  status: string
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

type AppSettings = {
  showInRow: boolean,
  colorScheme: number
}

interface HighlightImage extends ImageInfo{
  highlightType: number
}

type TransferPermission = {
  accept: boolean,
  images: string[]
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

const colorGradients = [{
  top: "#fedc2a",
  middle: "#dd5789",
  bottom: "#7a2c9e"
}, {
  top: "#959BA3",
  middle: "#848B98",
  bottom: "#D7D7D8"
}, {
  top: "#7fffc3",
  middle: "#0d9d9d",
  bottom: "#7AE5F5"
}, {
  top: "#ffd67f",
  middle: "#65359c",
  bottom: "#7a64c7"
}, {
  top: "#ebff7c",
  middle: "#3e9c35",
  bottom: "#64c785"
}, {
  top: "#ffdc7c",
  middle: "#a56530",
  bottom: "#c76464"
}]

const getBackgroundColor = (tagType: string) => {
  return tagType === "common" ? commonTagColor : (tagType === "char" ? charTagColor : specialTagColor)
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
  AppSettings,
  HighlightImage,
  SDProps,
  TransferPermission,
  commonTagColor,
  charTagColor,
  specialTagColor,
  activeColor,
  actions,
  initFilter,
  colorGradients,
  getBackgroundColor
}
