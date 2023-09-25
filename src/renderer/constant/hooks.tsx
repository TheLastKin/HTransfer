import { useEffect, useState } from "react"
import { ImageInfo } from "./types";

const useImageInfos: () => [a: ImageInfo[], (b: ImageInfo[]) => void] = () => {
  const [imageInfos, setImageInfos] = useState<ImageInfo[]>([]);
  useEffect(() => {
    const rawJSON = localStorage.getItem("imageInfos");
    if(rawJSON){
      setImageInfos(JSON.parse(rawJSON))
    }
  }, [])
  const saveImageInfos = (infos: ImageInfo[]) => {
    localStorage.setItem("imageInfos", JSON.stringify(infos))
    setImageInfos(infos)
  }
  return [imageInfos, saveImageInfos]
}

export{
  useImageInfos
}
