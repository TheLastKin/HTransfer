import { useEffect, useState } from "react"
import { AppSettings, Chapter, MediaFilter, MediaInfo, initFilter } from "./types";
import store from "./store";

const useMediaInfos: () => [a: MediaInfo[], (b: MediaInfo[]) => void] = () => {
  const [imageInfos, setMediaInfos] = useState<MediaInfo[]>([]);
  useEffect(() => {
    (async () => {
      const rawJSON = await store.get("imageInfos") as string;
      if(rawJSON){
        setMediaInfos(JSON.parse(rawJSON))
      }
    })()
  }, [])
  const saveMediaInfos = (infos: MediaInfo[]) => {
    store.set("imageInfos", JSON.stringify(infos))
    setMediaInfos(infos)
  }
  return [imageInfos, saveMediaInfos]
}

const useChapters: () => [a: Chapter[], (b: Chapter, remove?: boolean) => void] = () => {
  const [chapters, setChapters] = useState<Chapter[]>([])
  useEffect(() => {
    (async () => {
      const rawJSON = await store.get("chapters");
      if(rawJSON){
        setChapters(JSON.parse(rawJSON))
      }
    })()
  }, [])
  const saveChapter = (chapter: Chapter, remove?: boolean) => {
    const index = chapters.findIndex(c => c.name === chapter.name);
    if(index !== -1){
      let newChapters = remove ? chapters.filter(c => c.name !== chapter.name) : chapters.map(c => c.name === chapter.name ? chapter : c);
      setChapters(newChapters)
      store.set("chapters", JSON.stringify(newChapters))
    }else{
      let newChapters = chapters.concat([chapter]);
      setChapters(newChapters)
      store.set("chapters", JSON.stringify(newChapters))
    }
  }
  return [chapters, saveChapter]
}

const useMediaFilter: () => [a: MediaFilter, b: React.Dispatch<React.SetStateAction<MediaFilter>>] = () => {
  const [mediaFilter, setMediaFilter] = useState(initFilter)
  useEffect(() => {
    (async () => {
      const rawJSON = await store.get("mediaFilter") as string;
      if(rawJSON){
        setMediaFilter(JSON.parse(rawJSON))
      }
    })()
  }, [])
  return [mediaFilter, setMediaFilter]
}

const useAppSettings: () => [a: AppSettings, b: (c: AppSettings) => void] = () => {
  const [appSettings, setAppSettings] = useState<AppSettings>({ showInRow: false, colorScheme: 0 })
  useEffect(() => {
    (async () => {
      const rawJSON = await store.get("appSettings") as string;
      if(rawJSON){
        setAppSettings(JSON.parse(rawJSON))
      }
    })()
  }, [])
  const saveAppSettings = (settings: AppSettings) => {
    store.set("appSettings", JSON.stringify(settings));
    setAppSettings(settings)
  }
  return [appSettings, saveAppSettings]
}

export{
  useMediaInfos,
  useMediaFilter,
  useAppSettings,
  useChapters
}
