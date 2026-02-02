import { Buffer } from 'buffer';
import { MediaInfo, SDProps } from 'renderer/constant/types';
const extract = require('png-chunks-extract')
const text = require('png-chunk-text')

export async function loadSDPrompt(media: MediaInfo){
  try {
    let res = await fetch(media.path)
    if(res.status === 200){
      let buffer = Buffer.from(await res.arrayBuffer());
      let chunks = extract(buffer);
      const textChunks = chunks.filter((chunk: any) => chunk.name === "tEXt").map((chunk: any) => text.decode(chunk.data));
      if(textChunks[0]?.text?.includes("Sampler")){
        return { ofMedia: media.path, prompt: textChunks[0].text }
      }
    }
  } catch (error) {
    return null
  }
}
