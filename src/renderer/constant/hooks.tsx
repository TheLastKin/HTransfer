import { useEffect, useState } from "react"
import { ImageInfo } from "./types";
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

export{
  useImageInfos
}
