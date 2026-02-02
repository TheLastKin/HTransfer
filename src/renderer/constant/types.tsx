type Chapter = {
  name: string,
  medias?: MediaInfo[],
  createDate: number,
  modifiedDate: number,
}

type Tag = {
  name: string,
  type: string
}

type MediaInfo = {
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
  ofMedia: string,
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

type MediaFilter = {
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

interface HighlightMedia extends MediaInfo{
  highlightType: number
}

type TransferPermission = {
  accept: boolean,
  name: string,
  medias: string[]
}

const commonTagColor = 'rgb(85, 118, 190)';
const charTagColor = 'rgb(181, 184, 6)';
const specialTagColor = 'rgb(221, 34, 50)';
const activeColor = 'rgb(122, 245, 122)';
const actions = {
  ADD_TAG: "ADD_TAG",
  ADD_TAG_TO_MEDIA: "ADD_TAG_TO_MEDIA",
  ADD_CHAPTER: "ADD_CHAPTER",
  ADD_CHAPTER_MEDIA: "ADD_CHAPTER_MEDIA",
  DELETE_TAG_FROM_MEDIA: "DELETE_TAG_FROM_MEDIA"
}
const initFilter: MediaFilter = {
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
const maxMediaLoad = 30;

const getBackgroundColor = (tagType: string) => {
  return tagType === "common" ? commonTagColor : (tagType === "char" ? charTagColor : specialTagColor)
}

export {
  Chapter,
  MediaInfo,
  UpdateHistoryProps,
  Tag,
  UniqueTag,
  UniqueGroup,
  ModalProps,
  Action,
  MediaFilter,
  AppSettings,
  HighlightMedia,
  SDProps,
  TransferPermission,
  commonTagColor,
  charTagColor,
  specialTagColor,
  activeColor,
  actions,
  initFilter,
  colorGradients,
  maxMediaLoad,
  getBackgroundColor
}
