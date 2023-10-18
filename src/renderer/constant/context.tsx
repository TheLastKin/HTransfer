import React from 'react'
import { Action, ImageInfo, ModalProps, ImageFilter, initFilter, AppSettings, Chapter, SDProps } from "./types";

const AppContext = React.createContext<{
  savedInfos: ImageInfo[],
  saveImageInfos: (infos: ImageInfo[]) => void,
  imageFilter: ImageFilter,
  setImageFilter: React.Dispatch<React.SetStateAction<ImageFilter>>,
  appSettings: AppSettings,
  saveAppSettings: (settings: AppSettings) => void,
  chapters: Chapter[],
  saveChapter: (chapter: Chapter, remove?: boolean) => void,
  SDProps: SDProps[],
  setSDProps: (props: SDProps[]) => void
}>({
  savedInfos: [],
  saveImageInfos: ([]) => {},
  imageFilter: initFilter,
  setImageFilter: ({}) => {},
  appSettings: { showInRow: false, colorScheme: 0 },
  saveAppSettings: () => {},
  chapters: [],
  saveChapter: () => {},
  SDProps: [],
  setSDProps: () => {}
})
const ModalContext = React.createContext<{ modal: ModalProps, setModal: React.Dispatch<React.SetStateAction<ModalProps>> }>({ modal: { visible: false, message: "" }, setModal: () => {} });

export {
  AppContext,
  ModalContext,
}
