import React from 'react'
import { Action, ImageInfo, ModalProps, ImageFilter, initFilter } from "./types";

const AppContext = React.createContext<{
  savedInfos: ImageInfo[],
  saveImageInfos: (infos: ImageInfo[]) => void,
  imageFilter: ImageFilter,
  setImageFilter: React.Dispatch<React.SetStateAction<ImageFilter>>
}>({
  savedInfos: [],
  saveImageInfos: ([]) => {},
  imageFilter: initFilter,
  setImageFilter: ({}) => {}
})
const ModalContext = React.createContext<{ modal: ModalProps, setModal: React.Dispatch<React.SetStateAction<ModalProps>> }>({ modal: { visible: false, message: "" }, setModal: () => {} });

export {
  AppContext,
  ModalContext,
}
