import React from 'react'
import { Action, MediaInfo, ModalProps, MediaFilter, initFilter, AppSettings, Chapter, SDProps } from "./types";

const AppContext = React.createContext<{
  savedInfos: MediaInfo[],
  saveMediaInfos: (infos: MediaInfo[]) => void,
  mediaFilter: MediaFilter,
  setMediaFilter: React.Dispatch<React.SetStateAction<MediaFilter>>,
  appSettings: AppSettings,
  saveAppSettings: (settings: AppSettings) => void,
  chapters: Chapter[],
  saveChapter: (chapter: Chapter, remove?: boolean) => void,
  SDProps: SDProps[],
  setSDProps: (props: SDProps[]) => void
}>({
  savedInfos: [],
  saveMediaInfos: ([]) => {},
  mediaFilter: initFilter,
  setMediaFilter: ({}) => {},
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
