import { useEffect, useState } from "react"
import { AppSettings, ImageFilter, ImageInfo, initFilter } from "./types";
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
  useAppSettings
}
