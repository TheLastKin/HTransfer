import React from 'react'
import { Action, ImageInfo, ModalProps, ImageFilter, initFilter, AppSettings } from "./types";

const AppContext = React.createContext<{
  savedInfos: ImageInfo[],
  saveImageInfos: (infos: ImageInfo[]) => void,
  imageFilter: ImageFilter,
  setImageFilter: React.Dispatch<React.SetStateAction<ImageFilter>>,
  appSettings: AppSettings,
  saveAppSettings: (settings: AppSettings) => void,
}>({
  savedInfos: [],
  saveImageInfos: ([]) => {},
  imageFilter: initFilter,
  setImageFilter: ({}) => {},
  appSettings: { showInRow: false, colorScheme: 0 },
  saveAppSettings: () => {}
})
const ModalContext = React.createContext<{ modal: ModalProps, setModal: React.Dispatch<React.SetStateAction<ModalProps>> }>({ modal: { visible: false, message: "" }, setModal: () => {} });

export {
  AppContext,
  ModalContext,
}
