import { useEffect, useState } from "react"
import { AppSettings, Chapter, ImageFilter, ImageInfo, initFilter } from "./types";
import store from "./store";

const useImageInfos: () => [a: ImageInfo[], (b: ImageInfo[]) => void] = () => {
  const [imageInfos, setImageInfos] = useState<ImageInfo[]>([]);
  useEffect(() => {
    (async () => {
      const rawJSON = await store.get("imageInfos") as string;
      if(rawJSON){
        setImageInfos(JSON.parse(rawJSON))
      }
    })()
  }, [])
  const saveImageInfos = (infos: ImageInfo[]) => {
    store.set("imageInfos", JSON.stringify(infos))
    setImageInfos(infos)
  }
  return [imageInfos, saveImageInfos]
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

const useImageFilter: () => [a: ImageFilter, b: React.Dispatch<React.SetStateAction<ImageFilter>>] = () => {
  const [imageFilter, setImageFilter] = useState(initFilter)
  useEffect(() => {
    (async () => {
      const rawJSON = await store.get("imageFilter") as string;
      if(rawJSON){
        setImageFilter(JSON.parse(rawJSON))
      }
    })()
  }, [])
  return [imageFilter, setImageFilter]
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
  useImageInfos,
  useImageFilter,
  useAppSettings,
  useChapters
}
