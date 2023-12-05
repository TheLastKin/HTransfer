import { Buffer } from 'buffer';
import { ImageInfo, SDProps } from 'renderer/constant/types';
const extract = require('png-chunks-extract')
const text = require('png-chunk-text')

export async function loadSDPrompt(image: ImageInfo){
  try {
    let res = await fetch(image.path)
    if(res.status === 200){
      let buffer = Buffer.from(await res.arrayBuffer());
      let chunks = extract(buffer);
      const textChunks = chunks.filter((chunk: any) => chunk.name === "tEXt").map((chunk: any) => text.decode(chunk.data));
      if(textChunks[0]?.text?.includes("Sampler")){
        return { ofImage: image.path, prompt: textChunks[0].text }
      }
    }
  } catch (error) {
    return null
  }
}
